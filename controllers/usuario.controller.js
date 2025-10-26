
import { pool } from '../config/db.js';

// GET (Leer todos los usuarios, especialmente Técnicos)
export const getUsuarios = async (req, res) => {
  try {
    // Asumimos Rol 1 = Admin, Rol 2 = Técnico
    const [rows] = await pool.query(
      `SELECT PK_id_usuario, nombre, rut 
       FROM USUARIO 
       WHERE FK_id_rol = 2 AND activo = 1 
       ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};