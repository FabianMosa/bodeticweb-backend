// backend/routes/movimiento.routes.js
import { Router } from 'express';
import { registrarSalida } from '../controllers/movimiento.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js'; // Middleware de autenticación

const router = Router();

// Definimos la ruta POST /api/movimientos/salida
// La protegemos con verifyToken (Cualquier usuario logueado, Admin o Técnico, puede usarla)
router.post('/salida', verifyToken, registrarSalida);

// (Aquí añadiremos después la ruta para DEVOLUCIONES)

export default router;