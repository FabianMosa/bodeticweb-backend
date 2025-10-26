
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