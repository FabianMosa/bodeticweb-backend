import { pool } from "../config/db.js";

// GET (Obtener todos los proveedores para los dropdowns)
export const getProveedores = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT PK_id_proveedor, nombre_proveedor FROM PROVEEDOR ORDER BY nombre_proveedor ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en getProveedores:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
