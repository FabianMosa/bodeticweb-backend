import { Router } from 'express';
import { getProveedores } from '../controllers/proveedor.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Cualquiera que esté logueado (Admin o Técnico) puede ver los proveedores
router.get('/', verifyToken, getProveedores);

export default router;