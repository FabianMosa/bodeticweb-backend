
import { Router } from 'express';
import { getInsumos } from '../controllers/insumo.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js'; 

const router = Router();

// Aplicamos el middleware 'verifyToken' a esta ruta.
// Nadie podrá acceder a GET /api/insumos sin un token válido.
router.get('/', verifyToken, getInsumos);

// (Aquí añadiremos después: POST, PUT, DELETE)

export default router;