
import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

const router = Router();

// Definimos la ruta: POST /api/auth/login
// Cuando alguien llame a esta URL, se ejecutará la función 'login' del controlador
router.post('/login', login);

export default router;