
import { Router } from 'express';
import { getUsuarios } from '../controllers/usuario.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/usuarios/tecnicos
// Protegido por Token y solo para Admins
router.get('/tecnicos', [verifyToken, isAdmin], getUsuarios);

export default router;