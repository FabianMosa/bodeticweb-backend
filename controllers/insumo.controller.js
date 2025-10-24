// backend/controllers/insumo.controller.js
import { pool } from '../config/db.js';

// GET (Leer todos los insumos)
export const getInsumos = async (req, res) => {
  try {
    // Hacemos un JOIN para traer el nombre de la categoría (RF-07)
    const [rows] = await pool.query(`
      SELECT 
        i.PK_id_insumo, 
        i.nombre, 
        i.sku, 
        i.stock_actual, 
        i.stock_minimo,
        c.nombre_categoria 
      FROM INSUMO i
      JOIN CATEGORIA c ON i.FK_id_categoria = c.PK_id_categoria
      WHERE i.activo = 1
      ORDER BY i.nombre ASC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// (Aquí añadiremos después: POST, PUT, DELETE)