
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

// GET (Leer todos los usuarios, especialmente Técnicos)
export const getUsuarios = async (req, res) => {
  try {
    // Asumimos Rol 1 = Admin, Rol 2 = Técnico
    const [rows] = await pool.query(
      `SELECT PK_id_usuario, nombre, rut 
       FROM USUARIO 
       WHERE activo = 1 
       ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET (Obtener TODOS los usuarios - para la grilla de Admin)
export const getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.PK_id_usuario, u.nombre, u.rut, u.activo, r.nombre_rol
      FROM USUARIO u
      JOIN ROL r ON u.FK_id_rol = r.PK_id_rol
      ORDER BY u.nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
// GET (Obtener UN usuario por ID - para el formulario de Editar)
export const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT PK_id_usuario, nombre, rut, FK_id_rol, activo 
       FROM USUARIO 
       WHERE PK_id_usuario = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST (Crear un nuevo Usuario)
export const createUsuario = async (req, res) => {
  const { nombre, rut, password, id_rol } = req.body;

  if (!nombre || !rut || !password || !id_rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Encriptamos la contraseña (RNF-01)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO USUARIO (nombre, rut, password_hash, FK_id_rol, activo)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre, rut, password_hash, id_rol]
    );

    res.status(201).json({ message: 'Usuario creado con éxito', id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El RUT ingresado ya existe' });
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT (Actualizar un Usuario - Admin)
export const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, id_rol, activo } = req.body; // No actualizamos password aquí

  try {
    const [result] = await pool.query(
      `UPDATE USUARIO SET 
         nombre = ?, 
         rut = ?, 
         FK_id_rol = ?, 
         activo = ?
       WHERE PK_id_usuario = ?`,
      [nombre, rut, id_rol, activo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El RUT ingresado ya existe' });
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};