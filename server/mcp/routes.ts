import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../auth.js';
import { handleExecute } from './index.js';
import { User } from '../../shared/schema.js';

// Extendemos el tipo Request para incluir la propiedad `user` que añade `passport`
interface AuthenticatedRequest extends Request {
  user?: User;
}

const router = Router();

// Middleware de autorización específico para MCP
const isAuthorizedAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
};

// Proteger la ruta con autenticación y autorización
router.post('/execute', isAuthenticated, isAuthorizedAdmin, (req, res, next) => {
  handleExecute(req as AuthenticatedRequest, res).catch(next);
});

export default router;
