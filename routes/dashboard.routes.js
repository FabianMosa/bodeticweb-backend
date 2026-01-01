import { Router } from "express";
import { getAlertas } from "../controllers/dashboard.controller.js";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/dashboard/alertas
// Protegido por Token y solo para Admins (ya que es info sensible de gestión)
router.get("/alertas", [verifyToken, isAdmin], getAlertas);

export default router;
