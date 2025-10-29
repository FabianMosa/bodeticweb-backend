
import { Router } from 'express';
import { getUsuarios, 
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario } from '../controllers/usuario.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/usuarios/tecnicos
// Protegido por Token y solo para Admins
router.get('/tecnicos', [verifyToken, isAdmin], getUsuarios);

// --- AÑADIR RUTAS CRUD (Todas solo para Admin) ---

// GET /api/usuarios/ (Listar todos)
router.get('/', [verifyToken, isAdmin], getAllUsuarios);

// GET /api/usuarios/:id (Ver uno)
router.get('/:id', [verifyToken, isAdmin], getUsuarioById);

// POST /api/usuarios/ (Crear uno)
router.post('/', [verifyToken, isAdmin], createUsuario);

// PUT /api/usuarios/:id (Actualizar uno)
router.put('/:id', [verifyToken, isAdmin], updateUsuario);

// DELETE /api/usuarios/:id (Eliminar uno)
//router.delete('/:id', [verifyToken, isAdmin], deleteUsuario);  

export default router;