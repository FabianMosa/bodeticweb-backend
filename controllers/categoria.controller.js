
import { pool } from '../config/db.js';

// GET (Leer todas las categorías)
export const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CATEGORIA ORDER BY nombre_categoria ASC');
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};