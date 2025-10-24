
import { Router } from 'express';
import { getInsumos } from '../controllers/insumo.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js'; 
import { isAdmin } from '../middleware/auth.middleware.js';
import { createInsumo } from '../controllers/insumo.controller.js';


const router = Router();

// Aplicamos el middleware 'verifyToken' a esta ruta.
// Nadie podrá acceder a GET /api/insumos sin un token válido.
router.get('/', verifyToken, getInsumos);

// (Aquí añadiremos después: POST, PUT, DELETE)
// POST /api/insumos (Protegida por Token Y por rol de Admin)
router.post('/', [verifyToken, isAdmin], createInsumo);

export default router;