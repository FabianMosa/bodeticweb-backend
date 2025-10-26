
import { Router } from 'express';
import { registrarSalida,registrarDevolucion } from '../controllers/movimiento.controller.js';
import { verifyToken,isAdmin } from '../middleware/auth.middleware.js'; // Middleware de autenticación

const router = Router();

// Definimos la ruta POST /api/movimientos/salida
// La protegemos con verifyToken (Cualquier usuario logueado, Admin o Técnico, puede usarla)
router.post('/salida', verifyToken, registrarSalida);

// POST /api/movimientos/devolucion (Protegida por Admin)
router.post('/devolucion', [verifyToken, isAdmin], registrarDevolucion);

export default router;