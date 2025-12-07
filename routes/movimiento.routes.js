import { Router } from "express";
import {
  registrarSalida,
  registrarDevolucion,
  getPrestamosActivos,
  getHistorialMovimientos,
} from "../controllers/movimiento.controller.js";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js"; // Middleware de autenticación

const router = Router();

// Definimos la ruta POST /api/movimientos/salida
// La protegemos con verifyToken (Cualquier usuario logueado, Admin o Técnico, puede usarla)
router.post("/salida", verifyToken, registrarSalida);

// POST /api/movimientos/devolucion (Protegida por Admin)
router.post("/devolucion", [verifyToken, isAdmin], registrarDevolucion);

// GET /api/movimientos/prestamos
// Protegida por Token (lógica de Admin/Técnico está en el controlador)
router.get("/prestamos", verifyToken, getPrestamosActivos);

// GET /api/movimientos/historial (Protegida por Admin)
router.get("/historial", [verifyToken, isAdmin], getHistorialMovimientos);

export default router;
