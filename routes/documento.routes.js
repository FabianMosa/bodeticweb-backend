import { Router } from "express";
import { getDocumentoByCodigo } from "../controllers/documento.controller.js";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// ----------------------------------------------GET /api/documentos/buscar/:codigo
router.get("/buscar/:codigo", [verifyToken, isAdmin], getDocumentoByCodigo);

export default router;
