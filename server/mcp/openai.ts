import OpenAI from 'openai';
import 'dotenv/config';

if (!process.env.OPENAI_API_KEY) {
  // En desarrollo, podemos usar una clave falsa para evitar errores,
  // pero la API fallará. En producción, esto debería ser un error fatal.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno.');
  } else {
    console.warn('[MCP] Advertencia: OPENAI_API_KEY no encontrada. Las llamadas a la API fallarán.');
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-dev',
});

/**
 * Analiza un prompt de lenguaje natural usando OpenAI para extraer la intención y los parámetros.
 * @param prompt El comando del usuario.
 * @returns La respuesta estructurada del modelo.
 */
export async function analyzePrompt(prompt: string): Promise<any> {
  const model = process.env.OPENAI_MODEL_NAME || 'gpt-4o';

  console.log(`[MCP] Analitzant prompt amb el model: ${model}`);

  const systemMessage = `
    Ets un assistent intel·ligent per a una aplicació de control horari anomenada EduPresència.
    La teva tasca és analitzar les ordres de l'administrador, sempre en català, i traduir-les a un format JSON estructurat.
    El JSON ha de contenir una 'action' i un objecte 'parameters'.
    Les accions disponibles són: 'createUser', 'sendMessage', 'getReport'.
    Respon sempre i únicament amb l'objecte JSON. No incloguis explicacions ni text addicional. El JSON ha d'estar en català quan sigui pertinent (claus en camelCase).

    Exemples:
    - Ordre: "Crear un compte de professor per a Joan Pere amb l'email joan.pere@centre.edu i assignar-lo al departament de Ciències."
    - Resposta JSON: {"action": "createUser", "parameters": {"fullName": "Joan Pere", "email": "joan.pere@centre.edu", "role": "employee", "departmentName": "Ciències"}}

    - Ordre: "Envia un recordatori a tots els professors del departament de Matemàtiques sobre la reunió de demà."
    - Resposta JSON: {"action": "sendMessage", "parameters": {"departmentName": "Matemàtiques", "message": "Recordatori sobre la reunió de demà."}}
    
    - Ordre: "Genera un informe de resum d'assistència."
    - Resposta JSON: {"action": "getReport", "parameters": {"reportType": "attendance_overview"}}

    - Ordre: "Mostra'm l'informe d'assistència de l'Anna Font des del 15 de maig de 2024 fins avui."
    - Resposta JSON: {"action": "getReport", "parameters": {"reportType": "attendance_user", "fullName": "Anna Font", "startDate": "2024-05-15", "endDate": "YYYY-MM-DD"}} (substitueix YYYY-MM-DD per la data actual)

    - Ordre: "Informe de retards de tot el personal durant el darrer mes."
    - Resposta JSON: {"action": "getReport", "parameters": {"reportType": "lates_overview", "period": "last_month"}}

    - Ordre: "Dona'm l'historial legal complet per a 'Carme Roca' durant el mes de juny de 2024."
    - Resposta JSON: {"action": "getForensicReport", "parameters": {"fullName": "Carme Roca", "startDate": "2024-06-01", "endDate": "2024-06-30"}}

    - Ordre: "Analitza el risc d'absentisme durant els últims 3 mesos."
    - Resposta JSON: {"action": "getRiskAnalysis", "parameters": {"period": "last_3_months"}}

    - Ordre: "Envia un correu a 'usuari@exemple.com' amb l'assumpte 'Recordatori important' i el missatge 'Aquesta és una prova'."
    - Resposta JSON: {"action": "sendEmail", "parameters": {"recipientEmail": "usuari@exemple.com", "subject": "Recordatori important", "body": "Aquesta és una prova."}}

    - Ordre: "Com puc justificar una absència?"
    - Resposta JSON: {"action": "getHelp", "parameters": {"topic": "justificar absència"}}

    Analitza la següent ordre i respon únicament amb l'objecte JSON.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("La resposta d'OpenAI no conté contingut.");
    }

    console.log("[MCP] Resposta JSON d'OpenAI:", content);
    return JSON.parse(content);
  } catch (error) {
    console.error("[MCP] Error en trucar a l'API d'OpenAI:", error);
    throw new Error("No s'ha pogut processar l'ordre amb el model d'IA.");
  }
}

/**
 * Responde a una pregunta utilizando un contexto proporcionado (la base de conocimiento).
 * @param question La pregunta del usuario.
 * @param context El texto de la base de conocimiento.
 * @returns La respuesta en texto plano generada por el modelo.
 */
export async function analyzePromptWithContext(question: string, context: string): Promise<string> {
  const model = process.env.OPENAI_MODEL_NAME || 'gpt-4o';

  console.log(`[MCP] Responent pregunta amb context usant el model: ${model}`);

  const systemMessage = `
    Ets un assistent d'ajuda expert en l'aplicació EduPresència.
    La teva tasca és respondre a les preguntes de l'usuari de manera clara, concisa i amable, sempre en català.
    Basa les teves respostes ÚNICAMENT en la informació proporcionada en la següent 'Base de Coneixement'.
    No inventis funcionalitats que no estiguin descrites. Si no saps la resposta, digues que no tens prou informació sobre aquest tema.
    No revelis que ets un model d'IA ni mencionis la 'Base de Coneixement'. Actua com si fossis part integral de l'aplicació.

    --- BASE DE CONEIXEMENT ---
    ${context}
    --- FI DE LA BASE DE CONEIXEMENT ---
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: question },
      ],
      // No forzamos JSON aquí, queremos una respuesta en texto plano
    });

    const answer = completion.choices[0]?.message?.content;
    if (!answer) {
      return "No he pogut generar una resposta en aquests moments.";
    }

    console.log('[MCP] Resposta d\'ajuda generada:', answer);
    return answer;

  } catch (error) {
    console.error("[MCP] Error en trucar a l'API d'OpenAI per a ajuda:", error);
    throw new Error("No s'ha pogut generar una resposta d'ajuda.");
  }
}
