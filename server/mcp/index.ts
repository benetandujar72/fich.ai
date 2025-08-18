import { Request, Response } from 'express';
import { analyzePrompt } from './openai';
import { actionCatalog } from './actions';

interface AuthenticatedRequest extends Request {
  body: {
    prompt: string;
  };
  user?: {
    id: string;
    role: string;
    institutionId?: string;
    // ... otras propiedades del usuario
  };
}

/**
 * Maneja la ejecución de un comando MCP.
 */
export async function handleExecute(req: AuthenticatedRequest, res: Response) {
  const { prompt } = req.body;
  const executingUser = req.user;

  console.log(`[MCP] Recibido prompt: "${prompt}" de usuario: ${executingUser?.id}`);

  if (!executingUser) {
    // Esta comprobación es redundante si los middlewares de auth funcionan bien,
    // pero es una buena práctica de seguridad.
    return res.status(401).json({ message: 'No se pudo identificar al usuario que ejecuta la acción.' });
  }

  try {
    const analyzedData = await analyzePrompt(prompt);
    const { action, parameters } = analyzedData;

    if (!action || typeof action !== 'string') {
      throw new Error("El análisis de IA no devolvió una acción válida.");
    }

    // Buscar la acción en el catálogo
    const actionFunction = actionCatalog[action];
    if (!actionFunction) {
      throw new Error(`La acción '${action}' no es una acción reconocida por el sistema.`);
    }

    // Caso especial para 'getHelp': pasamos el prompt original como la pregunta
    if (action === 'getHelp') {
      parameters.question = prompt;
    }

    console.log(`[MCP] Ejecutando acción: ${action}`);
    
    // Ejecutar la acción y pasarle los parámetros y el usuario que la ejecuta
    const result = await actionFunction(parameters, executingUser);

    // Devolver el resultado de la acción real
    res.status(200).json({
      status: 'success',
      action: action,
      result: result,
    });

  } catch (error) {
    console.error('[MCP] Error en el flujo de ejecución:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({
      status: 'error',
      message: 'Ha ocurrido un error al procesar el comando.',
      details: errorMessage,
    });
  }
}
