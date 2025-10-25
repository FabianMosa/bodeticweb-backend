// backend/controllers/insumo.controller.js
import { pool } from '../config/db.js';

// GET (Leer todos los insumos)
export const getInsumos = async (req, res) => {
  try {
    // Hacemos un JOIN para traer el nombre de la categoría (RF-07)
    const [rows] = await pool.query(`
      SELECT 
        i.PK_id_insumo, 
        i.nombre, 
        i.sku, 
        i.stock_actual, 
        i.stock_minimo,
        c.nombre_categoria 
      FROM INSUMO i
      JOIN CATEGORIA c ON i.FK_id_categoria = c.PK_id_categoria
      WHERE i.activo = 1
      ORDER BY i.nombre ASC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// (Aquí añadiremos después: POST, PUT, DELETE)
// POST (Crear un Insumo)
export const createInsumo = async (req, res) => {
  // Obtenemos los datos del formulario
  const { nombre, sku, descripcion, stock_inicial, stock_minimo, id_categoria, fecha_vencimiento } = req.body;
  
  // Obtenemos el ID del admin que está haciendo la operación (gracias al middleware)
  const id_usuario_admin = req.usuario.id;

  // Iniciamos una conexión 'cliente' para manejar la transacción
  let connection;
  try {
    connection = await pool.getConnection(); // Pedimos una conexión del pool
    await connection.beginTransaction(); // ¡Iniciamos la transacción!

    // 1. Insertar el Insumo en la tabla INSUMO
    const [insumoResult] = await connection.query(
      `INSERT INTO INSUMO (nombre, sku, descripcion, stock_actual, stock_minimo, FK_id_categoria, fecha_vencimiento, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [nombre, sku, descripcion, stock_inicial, stock_minimo, id_categoria, fecha_vencimiento || null]
    );

    const nuevoInsumoId = insumoResult.insertId;

    // 2. Insertar el Movimiento de 'Entrada' en la tabla MOVIMIENTO
    await connection.query(
      `INSERT INTO MOVIMIENTO (FK_id_insumo, FK_id_usuario, tipo_movimiento, cantidad, fecha_hora) 
       VALUES (?, ?, 'Entrada', ?, NOW())`,
      [nuevoInsumoId, id_usuario_admin, stock_inicial]
    );

    // 3. Si todo salió bien, confirmamos la transacción
    await connection.commit();

    res.status(201).json({ message: 'Insumo creado con éxito', id: nuevoInsumoId });

  } catch (error) {
    // 4. Si algo falló, revertimos la transacción
    if (connection) {
      await connection.rollback();
    }
    console.error(error);
    
    // Error común: SKU duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El SKU o Nombre ingresado ya existe.' });
    }
    
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    // 5. Siempre liberamos la conexión al final
    if (connection) {
      connection.release();
    }
  }
};

// GET (Leer UN insumo por ID)
export const getInsumoById = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID de la URL
  try {
    const [rows] = await pool.query(
      'SELECT * FROM INSUMO WHERE PK_id_insumo = ?', 
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }
    
    res.json(rows[0]); // Devolvemos solo el primer resultado
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// --- AÑADIR ESTA NUEVA FUNCIÓN ---
// PUT (Actualizar un Insumo)
export const updateInsumo = async (req, res) => {
  const { id } = req.params;
  // OJO: No permitimos actualizar el stock_actual aquí.
  // Eso debe ser a través de un MOVIMIENTO (Salida, Préstamo, Ajuste).
  const { nombre, sku, descripcion, stock_minimo, id_categoria, fecha_vencimiento } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE INSUMO SET 
         nombre = ?, 
         sku = ?, 
         descripcion = ?, 
         stock_minimo = ?, 
         FK_id_categoria = ?, 
         fecha_vencimiento = ?
       WHERE PK_id_insumo = ?`,
      [nombre, sku, descripcion, stock_minimo, id_categoria, fecha_vencimiento || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    res.json({ message: 'Insumo actualizado con éxito' });

  } catch (error) {
    console.error(error);
    // Error común: SKU duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El SKU o Nombre ingresado ya existe.' });
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE (Eliminar un Insumo - desactivarlo)
export const deleteInsumo = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      `UPDATE INSUMO SET activo = 0 WHERE PK_id_insumo = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    res.json({ message: 'Insumo eliminado (desactivado) con éxito' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};