
import { pool } from '../config/db.js';

// GET (Leer todos los insumos)
export const getInsumos = async (req, res) => {
  // Obtenemos el filtro de la URL (query string)
  const { activo } = req.query; // 'true' o 'false'

  try {
    let query = `
      SELECT 
        i.PK_id_insumo, 
        i.nombre, 
        i.sku, 
        i.stock_actual, 
        i.stock_minimo,
        c.nombre_categoria,
        i.activo          -- <-- 1. AÑADIR ESTE CAMPO
      FROM INSUMO i
      JOIN CATEGORIA c ON i.FK_id_categoria = c.PK_id_categoria
    `;
    
    const queryParams = [];

    // 2. AÑADIR FILTRO DINÁMICO
    if (activo === 'true') {
      query += ' WHERE i.activo = 1';
    } else if (activo === 'false') {
      query += ' WHERE i.activo = 0';
    }
    // Si 'activo' no se envía, trae TODOS (útil para el futuro)

    query += ' ORDER BY i.nombre ASC';
    
    const [rows] = await pool.query(query, queryParams);
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

// PUT (Cambiar estado activo/inactivo de un Insumo)
export const toggleInsumoActivo = async (req, res) => {
  const { id } = req.params;
  
  // El frontend enviará el estado opuesto
  // Ej: Si está activo (1), enviará 'false' para desactivarlo (0)
  const { nuevoEstado } = req.body; 

  if (nuevoEstado === undefined || (nuevoEstado !== true && nuevoEstado !== false)) {
    return res.status(400).json({ message: "Se requiere un 'nuevoEstado' (true/false)." });
  }
  
  try {
    const [result] = await pool.query(
      'UPDATE INSUMO SET activo = ? WHERE PK_id_insumo = ?',
      [nuevoEstado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    res.json({ 
      message: `Insumo ${nuevoEstado ? 'habilitado' : 'deshabilitado'} con éxito.` 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getInsumoBySku = async (req, res) => {
  const { sku } = req.params; // Obtenemos el SKU de la URL
  try {
    // Buscamos el insumo que esté activo y coincida con el SKU
    const [rows] = await pool.query(
      'SELECT * FROM INSUMO WHERE sku = ? AND activo = 1', 
      [sku]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado o inactivo' });
    }
    
    res.json(rows[0]); // Devolvemos el insumo
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE (Eliminar un Insumo - desactivarlo)
/*export const deleteInsumo = async (req, res) => {
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
};*/
