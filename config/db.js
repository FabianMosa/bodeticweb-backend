// config/db.js
import mysql from 'mysql2/promise';
import 'dotenv/config'; // Carga las variables del .env

export const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'bfms1009',
  database: process.env.MYSQLDATABASE || 'bodetic',
  //waitForConnections: true,
  //connectionLimit: 10,
  //queueLimit: 0
});

console.log('Conexión a la BD establecida con éxito.');