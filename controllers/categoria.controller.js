import { pool } from "../config/db.js";

// GET (Obtener todas las categorías para los dropdowns)
export const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT PK_id_categoria, nombre_categoria FROM CATEGORIA ORDER BY nombre_categoria ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en getCategorias:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
