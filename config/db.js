// config/db.js
import mysql from "mysql2/promise";
import "dotenv/config"; // Carga las variables del .env

// Determina las variables correctas (Producción en Railway vs. Desarrollo Local)
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
const dbUser = process.env.DB_USER || process.env.MYSQLUSER;
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
const dbDatabase = process.env.DB_DATABASE || process.env.MYSQLDATABASE;
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || 3306; // ¡ESTE ES EL CAMBIO CLAVE!

// Solo mostrar info de conexión en desarrollo (sin credenciales sensibles)
if (process.env.NODE_ENV !== 'production') {
  console.log(`Conectando a BD: ${dbHost}:${dbPort}/${dbDatabase}`);
}

export const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
  port: parseInt(dbPort), // Asegúrate de que el puerto sea un número

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Añadir timeouts para evitar cuelgues
  connectTimeout: 10000,
  acquireTimeout: 10000,
});

// Prueba de conexión al iniciar
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Conexión a la BBDD (Pool) establecida con éxito.");
    connection.release();
  })
  .catch((err) => {
    console.error(
      "❌ Error al conectar con el Pool de la BBDD:",
      err.code,
      err.message
    );
  });
