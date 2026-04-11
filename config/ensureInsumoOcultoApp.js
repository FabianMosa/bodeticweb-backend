import { pool } from "./db.js";

/**
 * Asegura la columna `oculto_app` en la tabla de insumos si aún no existe.
 * Evita errores en cascada cuando no se ejecutó el SQL manual (`migrations/001_insumo_oculto_app.sql`).
 * Idempotente: seguro llamar en cada arranque del servidor.
 */
export async function ensureInsumoOcultoAppColumn() {
  const [[tableRow]] = await pool.query(
    `SELECT TABLE_NAME AS t FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'insumo'
     LIMIT 1`,
  );

  if (!tableRow?.t) {
    console.warn(
      "[ensureInsumoOcultoApp] No se encontró tabla insumo en la BD actual; se omite migración.",
    );
    return;
  }

  const tableName = tableRow.t;

  const [[colRow]] = await pool.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'oculto_app'`,
    [tableName],
  );

  if (colRow.c > 0) {
    return;
  }

  const sql = `
    ALTER TABLE \`${tableName}\`
      ADD COLUMN oculto_app TINYINT(1) NOT NULL DEFAULT 0
      COMMENT '1 = retirado de la app; conserva trazabilidad en BD'
      AFTER activo
  `;

  try {
    await pool.query(sql);
    console.log(
      "[ensureInsumoOcultoApp] Columna oculto_app añadida correctamente a",
      tableName,
    );
  } catch (err) {
    // Carrera o migración ya aplicada en otro proceso
    if (err.code === "ER_DUP_FIELDNAME") {
      return;
    }
    throw err;
  }
}
