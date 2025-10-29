
import { Router } from 'express';
import { getCategorias } from '../controllers/categoria.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Cualquiera que esté logueado (Admin o Técnico) puede ver las categorías
router.get('/', verifyToken, getCategorias);

export default router;