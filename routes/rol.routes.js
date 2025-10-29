
import { Router } from 'express';
import { getRoles } from '../controllers/rol.contoller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Solo el Admin puede ver la lista de roles para crear/editar usuarios
router.get('/', [verifyToken, isAdmin], getRoles);

export default router;