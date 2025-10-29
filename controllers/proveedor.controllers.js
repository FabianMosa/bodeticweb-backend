
import { pool } from '../config/db.js';

// GET (Obtener todos los proveedores activos)
export const getProveedores = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT PK_id_proveedor, nombre_proveedor FROM PROVEEDOR ORDER BY nombre_proveedor ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};