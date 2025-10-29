
import { Router } from 'express';
import { verifyToken,isAdmin } from '../middleware/auth.middleware.js'; 
import { 
  getInsumos, 
  createInsumo,
  getInsumoById, 
  updateInsumo,
  toggleInsumoActivo,
  getInsumoBySku    
} from '../controllers/insumo.controller.js';



const router = Router();

// Aplicamos el middleware 'verifyToken' a esta ruta.
// Nadie podrá acceder a GET /api/insumos sin un token válido.
router.get('/', verifyToken, getInsumos);

// (Aquí añadiremos después: POST, PUT, DELETE)
// POST /api/insumos (Protegida por Token Y por rol de Admin)
router.post('/', [verifyToken, isAdmin], createInsumo);

// GET /api/insumos/:id (Protegida por Token)
// La necesita el Admin (para editar) y el Técnico (para ver detalle)
router.get('/:id', verifyToken, getInsumoById);

// PUT /api/insumos/:id (Protegida por Admin)
router.put('/:id', [verifyToken, isAdmin], updateInsumo);
// DELETE /api/insumos/:id (Protegida por Admin)

router.put('/:id/toggle-activo', [verifyToken, isAdmin], toggleInsumoActivo);

router.get('/sku/:sku', verifyToken, getInsumoBySku);

export default router;