
import { Router } from 'express';
import { getProveedores } from '../controllers/proveedor.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Protegido por Admin, ya que solo ellos registran ingresos
router.get('/', [verifyToken, isAdmin], getProveedores);

export default router;