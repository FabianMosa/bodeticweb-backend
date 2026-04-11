import { Router } from "express";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";
import {
  getInsumos,
  createInsumo,
  getInsumoById,
  updateInsumo,
  toggleInsumoActivo,
  ocultarInsumoDeApp,
  getInsumoBySku,
  updateUbicacion,
} from "../controllers/insumo.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

// Listado con filtros y paginación (requiere token)
router.get("/", verifyToken, getInsumos);
// Crear insumo con imagen opcional (admin + multipart "imagen")
router.post("/", [verifyToken, isAdmin, upload.single("imagen")], createInsumo);

// Rutas con path fijo o varios segmentos ANTES de /:id (Express 5 / path-to-regexp: orden seguro)
router.get("/sku/:sku", verifyToken, getInsumoBySku);
router.put("/:id/toggle-activo", [verifyToken, isAdmin], toggleInsumoActivo);
router.put("/:id/ocultar-app", [verifyToken, isAdmin], ocultarInsumoDeApp);
// Actualizar foto de ubicación y/o coordenadas (admin + multipart "imagen_ubicacion")
router.put("/:id/ubicacion", [verifyToken, isAdmin, upload.single("imagen_ubicacion")], updateUbicacion);

router.get("/:id", verifyToken, getInsumoById);
router.put("/:id", [verifyToken, isAdmin], updateInsumo);

export default router;
