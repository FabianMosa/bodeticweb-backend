// config/db.js
import mysql from 'mysql2/promise';
import 'dotenv/config'; // Carga las variables del .env

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bfms1009',
  database: process.env.DB_DATABASE || 'bodetic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Conexión a la BD establecida con éxito.');