import { pool } from '../config/db.js';

// GET (Leer todas las categorías)
export const getProveedores = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM PROVEEDOR ORDER BY nombre_proveedor ASC');
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};