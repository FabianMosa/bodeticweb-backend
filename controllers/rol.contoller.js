
import { pool } from '../config/db.js';

export const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ROL');
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
