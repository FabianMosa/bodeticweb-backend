import jwt from "jsonwebtoken";

/** Verifica JWT en header Authorization (Bearer <token>) y deja el usuario en req.usuario */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res
      .status(401)
      .json({ message: "No hay token, autorización denegada" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ message: "Token no es válido" });
    }
    req.usuario = usuario;
    next();
  });
};

/** Solo permite continuar si req.usuario.rol === 1 (Administrador) */
export const isAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === 1) {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere rol de Administrador." });
  }
};
