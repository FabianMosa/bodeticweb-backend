
import jwt from 'jsonwebtoken';

// ... (El código de verifyToken que ya teníamos) ...
export const verifyToken = (req, res, next) => {
  // El token vendrá en el header 'Authorization'
  const authHeader = req.headers['authorization'];
  
  // El formato es "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // Si no hay token, no está autorizado
    return res.status(401).json({ message: 'No hay token, autorización denegada' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ message: 'Token no es válido' });
    }
    req.usuario = usuario; // Aquí guardamos el usuario (incluye el rol)
    next();
  });
};

// --- AÑADIR ESTE NUEVO MIDDLEWARE ---
export const isAdmin = (req, res, next) => {
  // Asumimos que el rol de "Administrador" tiene el PK_id_rol = 1
  // (Esto viene del token que guardamos en req.usuario)
  
  if (req.usuario && req.usuario.rol === 1) {
    next(); // El usuario es Admin, puede continuar
  } else {
    return res.status(403).json({ message: 'Acceso denegado. Requiere rol de Administrador.' });
  }
};

