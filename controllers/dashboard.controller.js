
import { pool } from '../config/db.js';

// GET (Obtener todas las alertas para el dashboard)
export const getAlertas = async (req, res) => {
  try {
    // 1. Alerta de Stock Bajo (RF-12)
    const [stockBajo] = await pool.query(`
      SELECT PK_id_insumo, nombre, sku, stock_actual, stock_minimo
      FROM INSUMO
      WHERE stock_actual <= stock_minimo AND activo = 1
      ORDER BY (stock_actual - stock_minimo) ASC
    `);

    // 2. Alerta de Próximos a Vencer (RF-12)
    // (Ej: Alerta 30 días antes de la fecha de vencimiento)
    const [porVencer] = await pool.query(`
      SELECT PK_id_insumo, nombre, sku, fecha_vencimiento
      FROM INSUMO
      WHERE fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND activo = 1
      ORDER BY fecha_vencimiento ASC
    `);

    res.json({
      stockBajo,
      porVencer
    });

  } catch (error)
 {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};