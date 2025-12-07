import { pool } from "../config/db.js";

//---------------------------------------------------------- GET (Leer todos los insumos)
export const getInsumos = async (req, res) => {
  const {
    activo = "true", // Por defecto, solo trae activos
    categoria = "",
    search = "",
    page = 1,
    limit = 9, // (Asegúrarse que coincida con frontend)
  } = req.query;

  const offset = (page - 1) * limit;
  const limitNumeric = parseInt(limit, 10);

  try {
    let queryParams = [];

    // ---'''''''''''''''''''''''''''''''''''''''CONSTRUCCIÓN DE LA CONSULTA BASE ---
    let queryBase = `
      FROM INSUMO i
      JOIN CATEGORIA c ON i.FK_id_categoria = c.PK_id_categoria
      WHERE 1=1
    `;

    //''''''''''''''''''''''''''''''''''''''''''''' Filtro de Activo (true/false)
    if (activo === "true") {
      queryBase += " AND i.activo = 1";
    } else if (activo === "false") {
      queryBase += " AND i.activo = 0";
    }

    //''''''''''''''''''''''''''''''''''''''''''''''''''''''' Filtro de Categoría
    if (categoria) {
      queryBase += " AND i.FK_id_categoria = ?";
      queryParams.push(categoria);
    }

    // ----------------------------------------------------------- NUEVO FILTRO DE BÚSQUEDA POR NOMBRE ---
    if (search) {
      queryBase += " AND i.nombre LIKE ?";
      queryParams.push(`%${search}%`); // Busca coincidencias parciales
    }

    // -----------------------------------------------------------CONSULTA 1: Contar el total de items (con filtros) ---
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as totalItems ${queryBase}`,
      queryParams
    );
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limitNumeric);

    // -----------------------------------------------------------CONSULTA 2: Obtener los datos de la página actual ---
    const [dataRows] = await pool.query(
      `SELECT 
        i.PK_id_insumo, i.nombre, i.sku, 
        i.stock_actual, i.stock_minimo,
        c.nombre_categoria,
        i.activo,
        i.FK_id_categoria          
      ${queryBase}
      ORDER BY i.nombre ASC
      LIMIT ? OFFSET ?`,
      [...queryParams, limitNumeric, offset] // Añadir limit y offset
    );

    // --------------------------------------------------------Devolver la respuesta paginada ---
    res.json({
      data: dataRows,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: totalPages,
        totalItems: totalItems,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// POST (Crear un Insumo)
export const createInsumo = async (req, res) => {
  const {
    nombre,
    sku,
    descripcion,
    stock_inicial,
    stock_minimo,
    id_categoria,
    fecha_vencimiento,
    id_documento_existente,
    id_proveedor,
    codigo_documento,
    fecha_emision,
  } = req.body;

  const id_usuario_admin = req.usuario.id;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Iniciar Transacción

    let finalDocumentoId;

    // Lógica "Buscar o Crear" Documento
    if (id_documento_existente) {
      // CASO A: El frontend ya nos dio el ID (el usuario usó el botón "Buscar")
      finalDocumentoId = id_documento_existente;
    } else {
      // CASO B: No tenemos ID. Puede ser nuevo o el usuario no buscó.
      if (!id_proveedor || !codigo_documento || !fecha_emision) {
        throw new Error("Proveedor, N° de Documento y Fecha son requeridos.");
      }

      // 1.1 Verificar si el documento YA EXISTE en la BBDD antes de insertar
      const [existingDocs] = await connection.query(
        "SELECT PK_id_documento FROM DOCUMENTO_INGRESO WHERE codigo_documento = ?",
        [codigo_documento]
      );

      if (existingDocs.length > 0) {
        // Usamos el ID existente y evitamos el error de duplicado
        finalDocumentoId = existingDocs[0].PK_id_documento;
      } else {
        // NO EXISTE: Creamos uno nuevo
        const [docResult] = await connection.query(
          `INSERT INTO DOCUMENTO_INGRESO (FK_id_proveedor, codigo_documento, fecha_emision)
           VALUES (?, ?, ?)`,
          [id_proveedor, codigo_documento, fecha_emision]
        );
        finalDocumentoId = docResult.insertId;
      }
    }

    // Insertar el Insumo
    const [insumoResult] = await connection.query(
      `INSERT INTO INSUMO (nombre, sku, descripcion, stock_actual, stock_minimo, FK_id_categoria, fecha_vencimiento, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        nombre,
        sku,
        descripcion || null,
        stock_inicial,
        stock_minimo,
        id_categoria,
        fecha_vencimiento || null,
      ]
    );
    const nuevoInsumoId = insumoResult.insertId;

    // Insertar el Movimiento de 'Entrada'
    await connection.query(
      `INSERT INTO MOVIMIENTO (FK_id_insumo, FK_id_usuario, tipo_movimiento, cantidad, fecha_hora, FK_id_documento) 
       VALUES (?, ?, 'Entrada', ?, NOW(), ?)`,
      [nuevoInsumoId, id_usuario_admin, stock_inicial, finalDocumentoId]
    );

    // Confirmar la transacción
    await connection.commit();

    res.status(201).json({
      message: "Insumo creado y asociado al documento con éxito",
      id: nuevoInsumoId,
      documentoId: finalDocumentoId,
    });

    // --- Manejo de errores y rollback ---
  } catch (error) {
    if (connection) await connection.rollback(); // Revertir en caso de error
    console.error("Error en createInsumo:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "El SKU o Nombre ya existe." });
    }
    // Devolver el mensaje de error específico (ej. "Proveedor... es requerido")
    return res
      .status(500)
      .json({ message: error.message || "Error interno del servidor" });
  } finally {
    if (connection) connection.release(); // Liberar la conexión
  }
};

// GET (Leer UN insumo por ID)
export const getInsumoById = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID de la URL
  try {
    const [rows] = await pool.query(
      "SELECT * FROM INSUMO WHERE PK_id_insumo = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    res.json(rows[0]); // Devolvemos solo el primer resultado
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// PUT (Actualizar un Insumo)
export const updateInsumo = async (req, res) => {
  const { id } = req.params;
  // OJO: No permitimos actualizar el stock_actual aquí.
  // Eso debe ser a través de un MOVIMIENTO (Salida, Préstamo, Ajuste).
  const {
    nombre,
    sku,
    descripcion,
    stock_minimo,
    id_categoria,
    fecha_vencimiento,
  } = req.body;

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
      [
        nombre,
        sku,
        descripcion,
        stock_minimo,
        id_categoria,
        fecha_vencimiento || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    res.json({ message: "Insumo actualizado con éxito" });
  } catch (error) {
    console.error(error);
    // Error común: SKU duplicado
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El SKU o Nombre ingresado ya existe." });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// PUT (Cambiar estado activo/inactivo de un Insumo)
export const toggleInsumoActivo = async (req, res) => {
  const { id } = req.params;

  // El frontend enviará el estado opuesto
  // Ej: Si está activo (1), enviará 'false' para desactivarlo (0)
  const { nuevoEstado } = req.body;

  if (
    nuevoEstado === undefined ||
    (nuevoEstado !== true && nuevoEstado !== false)
  ) {
    return res
      .status(400)
      .json({ message: "Se requiere un 'nuevoEstado' (true/false)." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE INSUMO SET activo = ? WHERE PK_id_insumo = ?",
      [nuevoEstado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    res.json({
      message: `Insumo ${
        nuevoEstado ? "habilitado" : "deshabilitado"
      } con éxito.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getInsumoBySku = async (req, res) => {
  const { sku } = req.params; // Obtenemos el SKU de la URL
  try {
    // Buscamos el insumo que esté activo y coincida con el SKU
    const [rows] = await pool.query(
      "SELECT * FROM INSUMO WHERE sku = ? AND activo = 1",
      [sku]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Insumo no encontrado o inactivo" });
    }

    res.json(rows[0]); // Devolvemos el insumo
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// DELETE (Eliminar un Insumo - desactivado)
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
