
import { pool } from '../config/db.js';

// ----------------------------------------------GET (Buscar un documento por su código)
export const getDocumentoByCodigo = async (req, res) => {
  const { codigo } = req.params;
  try {
    const [rows] = await pool.query(
      //--------------------------------------- Hacemos JOIN con Proveedor para devolver el nombre
      `SELECT d.PK_id_documento, d.codigo_documento, d.fecha_emision, d.FK_id_proveedor, p.nombre_proveedor
       FROM DOCUMENTO_INGRESO d
       JOIN PROVEEDOR p ON d.FK_id_proveedor = p.PK_id_proveedor
       WHERE d.codigo_documento = ?`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado. Puedes crear uno nuevo.' });
    }
    
    res.json(rows[0]); // Devolvemos el documento encontrado
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};