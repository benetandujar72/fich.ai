import { storage } from '../storage.js'; // Asegúrate que la ruta es correcta
import { emailService } from '../emailService.js'; // Importamos el servicio de email
import { knowledgeBase } from './knowledge_base.js'; // Importamos la base de conocimiento
import { analyzePromptWithContext } from './openai.js'; // Asumimos que esta función existirá

// Definimos los tipos de parámetros para cada acción para tener un código más seguro y predecible.
interface CreateUserParams {
  fullName: string;
  email: string;
  role?: 'employee' | 'admin';
  departmentName?: string;
}

interface SendMessageParams {
  departmentName: string;
  message: string;
}

interface GetReportParams {
  reportType: 'absences' | 'attendance_overview' | 'lates_overview' | 'attendance_user';
  period?: 'last_month' | 'last_week'; // Para simplificar
  fullName?: string;
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string;   // Formato YYYY-MM-DD
}

interface GetForensicReportParams {
  fullName: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string;   // Formato YYYY-MM-DD
}

interface GetRiskAnalysisParams {
  period: 'last_month' | 'last_3_months' | 'last_6_months';
}

interface SendEmailParams {
  recipientEmail: string;
  subject: string;
  body: string;
}

interface GetHelpParams {
  topic: string;
  question: string; // Pasaremos la pregunta original del usuario
}

// Interfaz para el usuario que ejecuta la acción
interface ExecutingUser {
  id: string;
  role: string;
  institutionId?: string;
}


// --- Implementación de Acciones ---

/**
 * Crea un nuevo usuario en el sistema.
 * @param params Parámetros para crear el usuario.
 * @returns El usuario recién creado.
 */
async function createUser(params: CreateUserParams) {
  console.log('[MCP][Action:createUser] Ejecutando con parámetros:', params);

  const { fullName, email, role = 'employee' } = params;

  if (!fullName || !email) {
    throw new Error('El nombre completo y el email son requeridos para crear un usuario.');
  }

  // Dividir el nombre completo en nombre y apellido
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  // Aquí llamamos a tu lógica de negocio existente.
  // Es posible que necesitemos ajustar esto según cómo funcione exactamente `storage.upsertUser`.
  const newUser = await storage.upsertUser({
    id: globalThis.crypto.randomUUID(),
    email,
    firstName,
    lastName,
    role,
    // NOTA: La asignación de departamento necesitaría lógica adicional,
    // como buscar el ID del departamento a partir del nombre `departmentName`.
    // Por ahora, lo omitimos para mantenerlo simple.
  });

  console.log(`[MCP][Action:createUser] Usuario creado con ID: ${newUser.id}`);
  return newUser;
}

/**
 * Envía un mensaje a todos los usuarios de un departamento.
 * @param params Parámetros para enviar el mensaje.
 * @returns Un resumen de la operación.
 */
async function sendMessage(params: SendMessageParams, executingUser: ExecutingUser) {
  console.log('[MCP][Action:sendMessage] Ejecutando con parámetros:', params);

  const { departmentName, message } = params;
  if (!departmentName || !message) {
    throw new Error('El nombre del departamento y el mensaje son requeridos.');
  }

  // Asumimos que existe esta función. Si no, necesitaremos implementarla o adaptarla.
  const usersInDepartment = await storage.getUsersByDepartmentName(departmentName);

  if (!usersInDepartment || usersInDepartment.length === 0) {
    return {
      message: `No se encontraron usuarios en el departamento '${departmentName}'. No se enviaron mensajes.`,
      sentCount: 0,
    };
  }

  const senderId = executingUser.id; // Usar el ID del admin que ejecuta la acción
  const institutionId = executingUser.institutionId;

  if (!institutionId) {
    throw new Error('El usuario administrador no está asociado a ninguna institución.');
  }

  const promises = usersInDepartment.map(user => {
    return storage.createCommunication({
      id: globalThis.crypto.randomUUID(),
      institutionId: institutionId,
      senderId: senderId,
      recipientId: user.id,
      message_type: 'internal',
      subject: 'Comunicado del Administrador',
      content: message,
      status: 'sent',
      priority: 'normal',
      email_sent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  await Promise.all(promises);

  console.log(`[MCP][Action:sendMessage] ${usersInDepartment.length} mensajes enviados.`);
  return {
    message: `Mensaje enviado con éxito a ${usersInDepartment.length} usuario(s) del departamento '${departmentName}'.`,
    sentCount: usersInDepartment.length,
  };
}

/**
 * Genera un informe de asistencia.
 * @param params Parámetros para el informe.
 * @param executingUser El usuario administrador que ejecuta el comando.
 * @returns Los datos del informe.
 */
async function getReport(params: GetReportParams, executingUser: ExecutingUser) {
  console.log('[MCP][Action:getReport] Executing with parameters:', params);
  
  const { institutionId } = executingUser;
  if (!institutionId) {
    throw new Error("L'usuari administrador no està associat a cap institució.");
  }

  const { reportType, fullName, startDate, endDate, period } = params;
  
  // Convertir periodo a fechas si es necesario
  let finalStartDate, finalEndDate;
  if (period) {
    const now = new Date();
    finalEndDate = new Date();
    if (period === 'last_month') {
      finalStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else { // last_week
      finalStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
  } else if (startDate && endDate) {
    finalStartDate = new Date(startDate);
    finalEndDate = new Date(endDate);
  }

  switch (reportType) {
    case 'attendance_overview':
      const overviewData = await storage.getAttendanceOverview(institutionId, finalStartDate, finalEndDate);
      return {
        reportType: "Resum d'Assistència General",
        data: overviewData,
      };

    case 'attendance_user':
      if (!fullName) {
        throw new Error("Es requereix el nom complet de l'empleat per a aquest informe.");
      }
      const historyData = await storage.getAttendanceHistoryForUser(fullName, institutionId, finalStartDate, finalEndDate);
      return {
        reportType: `Historial d'Assistència per a ${fullName}`,
        count: historyData.length,
        data: historyData,
      };

    // Añadir casos para otros tipos de informes aquí (ej. 'lates_overview')
    // case 'lates_overview':
    //   // ... llamar a una función de storage para obtener los retrasos ...
    //   break;

    default:
      return {
        message: `El tipus d'informe '${reportType}' encara no està implementat o no és vàlid.`,
        supportedTypes: ['attendance_overview', 'attendance_user'],
      };
  }
}

/**
 * Genera un informe forense detallado para un usuario.
 * @param params Parámetros para el informe forense.
 * @param executingUser El usuario administrador que ejecuta el comando.
 * @returns El historial de eventos del usuario.
 */
async function getForensicReport(params: GetForensicReportParams, executingUser: ExecutingUser) {
  console.log('[MCP][Action:getForensicReport] Executing with parameters:', params);
  const { fullName, startDate, endDate } = params;
  const { institutionId } = executingUser;

  if (!institutionId) {
    throw new Error("L'usuari administrador no està associat a cap institució.");
  }
  if (!fullName || !startDate || !endDate) {
    throw new Error("Es requereix nom complet, data d'inici i data de fi per a l'informe forense.");
  }

  const reportData = await storage.getForensicDataForUser(
    fullName,
    institutionId,
    new Date(startDate),
    new Date(endDate)
  );

  return {
    reportType: `Informe Forense per a ${fullName}`,
    period: { from: startDate, to: endDate },
    eventCount: reportData.length,
    events: reportData,
  };
}

/**
 * Realiza un análisis de riesgo de absentismo.
 * @param params Parámetros para el análisis.
 * @param executingUser El usuario administrador que ejecuta el comando.
 * @returns Una lista de empleados clasificados por nivel de riesgo.
 */
async function getRiskAnalysis(params: GetRiskAnalysisParams, executingUser: ExecutingUser) {
  console.log('[MCP][Action:getRiskAnalysis] Executing with parameters:', params);
  const { period } = params;
  const { institutionId } = executingUser;

  if (!institutionId) {
    throw new Error("L'usuari administrador no està associat a cap institució.");
  }

  // 1. Definir el rango de fechas basado en el período
  const now = new Date();
  const endDate = new Date();
  let startDate;
  
  if (period === 'last_3_months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  } else if (period === 'last_6_months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  } else { // 'last_month' por defecto
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  // 2. Obtener los datos brutos del storage
  const riskData = await storage.getRiskAnalysisData(institutionId, startDate, endDate);

  // 3. Definir umbrales y clasificar a los empleados
  const classifiedEmployees = riskData.map(employee => {
    let riskLevel = 'Baix';
    let score = 0;

    // Puntuación por retrasos y ausencias
    score += (employee.totalLates || 0) * 1; // 1 punto por retraso
    score += (employee.totalAbsences || 0) * 3; // 3 puntos por ausencia injustificada

    if (score >= 10) {
      riskLevel = 'Crític';
    } else if (score >= 5) {
      riskLevel = 'Alt';
    } else if (score >= 2) {
      riskLevel = 'Moderat';
    }

    return {
      ...employee,
      riskScore: score,
      riskLevel: riskLevel,
    };
  }).filter(e => e.riskScore > 0); // Solo mostramos empleados con alguna incidencia

  return {
    reportType: `Anàlisi de Risc d'Absentisme`,
    period: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
    employeeCount: classifiedEmployees.length,
    results: classifiedEmployees,
  };
}

/**
 * Envía un correo electrónico a un destinatario específico.
 * @param params Parámetros para el envío del email.
 * @returns Un mensaje de confirmación.
 */
async function sendEmail(params: SendEmailParams) {
  console.log('[MCP][Action:sendEmail] Executing with parameters:', params);
  const { recipientEmail, subject, body } = params;

  if (!recipientEmail || !subject || !body) {
    throw new Error("Es requereix destinatari, assumpte i cos del missatge per enviar un correu.");
  }

  await emailService.sendEmail({
    to: recipientEmail,
    subject: subject,
    text: body, // Usamos el cuerpo para el texto plano
    html: `<p>${body}</p>`, // Y también para el HTML para mayor compatibilidad
  });

  return {
    message: `Correu electrònic enviat amb èxit a ${recipientEmail}.`,
    status: 'success',
  };
}

/**
 * Responde a una pregunta del usuario utilizando la base de conocimiento.
 * @param params Parámetros de la pregunta.
 * @returns La respuesta generada por el LLM.
 */
async function getHelp(params: GetHelpParams) {
  console.log('[MCP][Action:getHelp] Executing with parameters:', params);
  
  // En lugar de llamar a `analyzePrompt`, llamaremos a una nueva función
  // que le pasa la base de conocimiento como contexto.
  const answer = await analyzePromptWithContext(params.question, knowledgeBase);

  return {
    question: params.question,
    answer: answer,
  };
}


// --- Catálogo de Acciones ---

// El catálogo mapea el nombre de una acción (el string que devuelve el LLM)
// con la función que la implementa.
export const actionCatalog: Record<string, Function> = {
  createUser: createUser,
  sendMessage: sendMessage,
  getReport: getReport,
  getForensicReport: getForensicReport,
  getRiskAnalysis: getRiskAnalysis,
  sendEmail: sendEmail,
  getHelp: getHelp,
};
