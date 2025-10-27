
import { pool } from '../config/db.js';

// POST (Registrar una Salida, sea Uso o Préstamo)
export const registrarSalida = async (req, res) => {
  // Datos que envía el frontend (el modal)
  const { id_insumo, cantidad, tipo_movimiento, codigo_ot } = req.body;
  
  // El ID del usuario (Técnico o Admin) que está haciendo el registro
  const id_usuario = req.usuario.id; 

  // Validaciones básicas
  if (!id_insumo || !cantidad || !tipo_movimiento || !codigo_ot) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  if (cantidad <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser mayor a cero' });
  }
  if (tipo_movimiento !== 'Salida-Uso' && tipo_movimiento !== 'Préstamo') {
    return res.status(400).json({ message: 'Tipo de movimiento no válido' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // ¡INICIA TRANSACCIÓN!

    // ---- PASO 1: Verificar y Bloquear el Insumo ----
    // Usamos 'FOR UPDATE' para bloquear la fila y evitar que dos usuarios
    // saquen el mismo ítem al mismo tiempo (evita "race conditions").
    const [insumoRows] = await connection.query(
      'SELECT stock_actual FROM INSUMO WHERE PK_id_insumo = ? FOR UPDATE',
      [id_insumo]
    );

    if (insumoRows.length === 0) {
      throw new Error('Insumo no encontrado');
    }

    const stock_actual = insumoRows[0].stock_actual;

    // ---- PASO 2: Validar Stock ----
    if (stock_actual < cantidad) {
      throw new Error(`Stock insuficiente. Stock actual: ${stock_actual}`);
    }

    // ---- PASO 3: Gestionar la Hoja de Terreno (OT) ----
    // Buscamos la OT. Si no existe, la creamos. (RF-04)
    let id_ot;
    const [otRows] = await connection.query(
      'SELECT PK_id_ot FROM HOJA_TERRENO WHERE codigo_ot = ?',
      [codigo_ot]
    );

    if (otRows.length > 0) {
      // La OT ya existe
      id_ot = otRows[0].PK_id_ot;
    } else {
      // La OT no existe, la creamos
      const [newOtResult] = await connection.query(
        'INSERT INTO HOJA_TERRENO (codigo_ot, fecha) VALUES (?, CURDATE())',
        [codigo_ot]
      );
      id_ot = newOtResult.insertId;
    }

    // ---- PASO 4: Actualizar el Stock del Insumo ----
    const nuevo_stock = stock_actual - cantidad;
    await connection.query(
      'UPDATE INSUMO SET stock_actual = ? WHERE PK_id_insumo = ?',
      [nuevo_stock, id_insumo]
    );

    // ---- PASO 5: Registrar el Movimiento (RF-11) ----
    await connection.query(
      `INSERT INTO MOVIMIENTO (FK_id_insumo, FK_id_usuario, FK_id_ot, tipo_movimiento, cantidad, fecha_hora)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id_insumo, id_usuario, id_ot, tipo_movimiento, cantidad]
    );

    // ---- PASO 6: ¡ÉXITO! Confirmar la transacción ----
    await connection.commit();
    
    res.status(201).json({ 
      message: `${tipo_movimiento} registrado con éxito.`,
      nuevo_stock: nuevo_stock
    });

  } catch (error) {
    // ---- PASO 7: ¡ERROR! Revertir la transacción ----
    if (connection) {
      await connection.rollback();
    }
    console.error(error);
    // Enviamos el mensaje de error específico (ej. "Stock insuficiente")
    return res.status(500).json({ message: error.message || 'Error interno del servidor' });
  } finally {
    // 8. Siempre liberar la conexión
    if (connection) {
      connection.release();
    }
  }
};

// POST (Registrar una Devolución de un Préstamo)
export const registrarDevolucion = async (req, res) => {
  // Datos que envía el Admin
  const { id_insumo, cantidad_devuelta, id_usuario_tecnico } = req.body;
  
  // El ID del Admin que registra la devolución
  const id_admin = req.usuario.id; 

  if (!id_insumo || !cantidad_devuelta || !id_usuario_tecnico) {
    return res.status(400).json({ message: 'Insumo, cantidad y técnico son requeridos' });
  }
  if (cantidad_devuelta <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser mayor a cero' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // ¡INICIA TRANSACCIÓN!

    // (Validación Opcional Avanzada:
    // Aquí podrías verificar que 'id_usuario_tecnico' realmente
    // tenga 'cantidad_devuelta' de 'id_insumo' en préstamo.
    // Por ahora, confiamos en la operación del Admin).

    // ---- PASO 1: Incrementar el Stock del Insumo ----
    await connection.query(
      'UPDATE INSUMO SET stock_actual = stock_actual + ? WHERE PK_id_insumo = ?',
      [cantidad_devuelta, id_insumo]
    );

    // ---- PASO 2: Registrar el Movimiento de "Devolución"----
    // Guardamos quién lo DEVUELVE (id_usuario_tecnico)
    // y quién lo REGISTRA (id_admin) (aunque la BBDD solo tiene 1 campo de usuario,
    // usaremos el del técnico que lo devuelve).
    await connection.query(
      `INSERT INTO MOVIMIENTO (FK_id_insumo, FK_id_usuario, tipo_movimiento, cantidad, fecha_hora)
       VALUES (?, ?, 'Devolución', ?, NOW())`,
      [id_insumo, id_usuario_tecnico, cantidad_devuelta]
    );

    // ----  ¡ÉXITO! Confirmar la transacción ----
    await connection.commit();
    
    // Consultamos el nuevo stock para devolverlo
    const [stockRows] = await connection.query('SELECT stock_actual FROM INSUMO WHERE PK_id_insumo = ?', [id_insumo]);
    
    res.status(201).json({ 
      message: 'Devolución registrada con éxito.',
      nuevo_stock: stockRows[0].stock_actual
    });

  } catch (error) {
    // ----  ¡ERROR! Revertir la transacción ----
    if (connection) {
      await connection.rollback();
    }
    console.error(error);
    return res.status(500).json({ message: error.message || 'Error interno del servidor' });
  } finally {
    // 5. Siempre liberar la conexión
    if (connection) {
      connection.release();
    }
  }
};

// GET (Listar Préstamos Pendientes)
export const getPrestamosActivos = async (req, res) => {
  // Obtenemos el ID y Rol del usuario desde el token
  const id_usuario_token = req.usuario.id;
  const id_rol_token = req.usuario.rol;

  try {
    // Esta consulta usa GROUP BY y HAVING para encontrar préstamos
    // donde la suma de 'Préstamo' es MAYOR a la suma de 'Devolución'.
    
    let query = `
      SELECT 
        m.FK_id_insumo,
        i.nombre AS nombre_insumo,
        i.sku,
        m.FK_id_usuario,
        u.nombre AS nombre_usuario,
        SUM(CASE WHEN m.tipo_movimiento = 'Préstamo' THEN m.cantidad ELSE 0 END) AS total_prestado,
        SUM(CASE WHEN m.tipo_movimiento = 'Devolución' THEN m.cantidad ELSE 0 END) AS total_devuelto,
        (SUM(CASE WHEN m.tipo_movimiento = 'Préstamo' THEN m.cantidad ELSE 0 END) -
         SUM(CASE WHEN m.tipo_movimiento = 'Devolución' THEN m.cantidad ELSE 0 END)) AS cantidad_pendiente
      FROM MOVIMIENTO m
      JOIN INSUMO i ON m.FK_id_insumo = i.PK_id_insumo
      JOIN USUARIO u ON m.FK_id_usuario = u.PK_id_usuario
      WHERE m.tipo_movimiento IN ('Préstamo', 'Devolución')
    `;
    
    const queryParams = [];

    // Si NO es Admin (Rol 1), filtramos solo por su ID
    if (id_rol_token !== 1) {
      query += ' AND m.FK_id_usuario = ?';
      queryParams.push(id_usuario_token);
    }

    query += `
      GROUP BY m.FK_id_insumo, m.FK_id_usuario, i.nombre, i.sku, u.nombre
      HAVING cantidad_pendiente > 0
      ORDER BY u.nombre, i.nombre;
    `;

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Error interno del servidor' });
  }
};