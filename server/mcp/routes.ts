import { Router, Request } from 'express';
import { isAuthenticated } from '../auth.js';
import { handleExecute } from './index.js';

// Extendemos el tipo Request para incluir la propiedad `user` que añade `passport`
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    // ... otras propiedades del usuario
  };
}

const router = Router();

// Middleware de autorización específico para MCP
const isAuthorizedAdmin = (req: AuthenticatedRequest, res, next) => {
  const user = req.user;
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
};

// Proteger la ruta con autenticación y autorización
router.post('/execute', isAuthenticated, isAuthorizedAdmin, (req, res, next) => {
  handleExecute(req, res).catch(next);
});

export default router;
