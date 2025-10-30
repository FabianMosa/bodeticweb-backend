// backend/controllers/auth.controller.js
import { pool } from '../config/db.js'; // Importamos la conexión a la BBDD
import bcrypt from 'bcryptjs'; // Para comparar contraseñas encriptadas
import jwt from 'jsonwebtoken'; // Para generar el token

export const login = async (req, res) => {
  const { rut, password } = req.body;

  try {
    // 1. Validar que los datos llegaron
    if (!rut || !password) {
      return res.status(400).json({ message: 'RUT y contraseña son requeridos' });
    }

    // 2. Buscar al usuario en la BD por su RUT
    const [rows] = await pool.query('SELECT * FROM USUARIO WHERE rut = ? ', [rut]);

    if (rows.length === 0) {
      // Si no hay filas, el usuario no existe
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = rows[0];

    // 3. Comparar la contraseña ingresada con la de la BBDD
    const isMatch = await bcrypt.compare(password, usuario.password_hash);

    if (!isMatch) {
      // Si las contraseñas no coinciden
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    
    // 4. Si todo es correcto, crear el Token (JWT)
    const tokenPayload = {
      id: usuario.PK_id_usuario,
      rol: usuario.FK_id_rol, // ¡Muy importante para los permisos!
      nombre: usuario.nombre
    };

    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET, // Tu palabra secreta del .env
      { expiresIn: '8h' } // El token expirará en 8 horas
    );

    // 5. Enviar el token al frontend
    res.json({
      message: 'Login exitoso',
      token: token,
      usuario: tokenPayload
    });

  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({ message: 'Error interno del servidor-backend', error: error.message});
  }
};