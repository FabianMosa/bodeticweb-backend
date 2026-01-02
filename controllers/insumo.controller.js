import { pool } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// Helper para subir buffer a Cloudinary (Promisificado)
const uploadStream = (buffer) => {
  return new Promise((resolve, reject) => {
    const theTransformStream = cloudinary.uploader.upload_stream(
      { folder: "bodetic_insumos" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    let str = Readable.from(buffer);
    str.pipe(theTransformStream);
  });
};

// ---------------------------------------------------------- GET (Leer todos los insumos)
export const getInsumos = async (req, res) => {
  const {
    activo = "true",
    categoria = "",
    search = "",
    page = 1,
    limit = 20,
  } = req.query;

  const offset = (page - 1) * limit;
  const limitNumeric = parseInt(limit, 21);

  try {
    let queryParams = [];

    // Construcción de la consulta base
    let queryBase = `
      FROM INSUMO i
      JOIN CATEGORIA c ON i.FK_id_categoria = c.PK_id_categoria
      WHERE 1=1
    `;

    // Filtros
    if (activo === "true") {
      queryBase += " AND i.activo = 1";
    } else if (activo === "false") {
      queryBase += " AND i.activo = 0";
    }

    if (categoria) {
      queryBase += " AND i.FK_id_categoria = ?";
      queryParams.push(categoria);
    }

    if (search) {
      queryBase += " AND i.nombre LIKE ?";
      queryParams.push(`%${search}%`);
    }

    // Consulta 1: Contar total
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as totalItems ${queryBase}`,
      queryParams
    );
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limitNumeric);

    // Consulta 2: Obtener datos paginados
    const [dataRows] = await pool.query(
      `SELECT 
        i.PK_id_insumo, i.nombre, i.sku, 
        i.stock_actual, i.stock_minimo,
        c.nombre_categoria,
        i.activo,
        i.FK_id_categoria,
        i.imagen_ubicacion, 
        i.coordenada_x,
        i.coordenada_y
      ${queryBase}
      ORDER BY i.nombre ASC
      LIMIT ? OFFSET ?`,
      [...queryParams, limitNumeric, offset]
    );

    res.json({
      data: dataRows,
      pagination: {
        currentPage: parseInt(page, 21),
        totalPages: totalPages,
        totalItems: totalItems,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------- POST (Crear un Insumo)
export const createInsumo = async (req, res) => {
  const {
    nombre,
    sku,
    descripcion,
    stock_inicial,
    stock_minimo,
    id_categoria,
    fecha_vencimiento,
    // Datos Documento
    id_documento_existente,
    id_proveedor,
    codigo_documento,
    fecha_emision,
    // Datos Ubicación Visual
    coordenada_x,
    coordenada_y,
  } = req.body;

  const id_usuario_admin = req.usuario.id;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Gestión de Imagen (Cloudinary)
    let imageUrl = null;
    if (req.file) {
      try {
        const result = await uploadStream(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error subiendo a Cloudinary:", uploadError);
        throw new Error("Fallo al subir la imagen de ubicación.");
      }
    }

    // 2. Gestión de Documento (Lógica de Reutilización CORREGIDA)
    let finalDocumentoId;

    if (id_documento_existente) {
      // Caso A: El usuario seleccionó un documento existente en el frontend (botón buscar)
      finalDocumentoId = id_documento_existente;
    } else {
      // Caso B: No hay ID. Puede ser nuevo o el usuario escribió el código manualmente sin buscar.
      if (!id_proveedor || !codigo_documento || !fecha_emision) {
        throw new Error("Proveedor, N° de Documento y Fecha son requeridos.");
      }

      // IMPORTANTE: Verificamos si el código de documento YA EXISTE en la BD antes de insertar
      const [existingDocs] = await connection.query(
        "SELECT PK_id_documento FROM DOCUMENTO_INGRESO WHERE codigo_documento = ?",
        [codigo_documento]
      );

      if (existingDocs.length > 0) {
        // ¡Ya existe! Lo reutilizamos silenciosamente y evitamos el error de duplicado
        finalDocumentoId = existingDocs[0].PK_id_documento;
      } else {
        // No existe, procedemos a crear uno nuevo
        const [docResult] = await connection.query(
          `INSERT INTO DOCUMENTO_INGRESO (FK_id_proveedor, codigo_documento, fecha_emision)
           VALUES (?, ?, ?)`,
          [id_proveedor, codigo_documento, fecha_emision]
        );
        finalDocumentoId = docResult.insertId;
      }
    }

    // 3. Insertar el Insumo
    const [insumoResult] = await connection.query(
      `INSERT INTO INSUMO (
          nombre, sku, descripcion, stock_actual, stock_minimo, 
          FK_id_categoria, fecha_vencimiento, activo,
          imagen_ubicacion, coordenada_x, coordenada_y
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        nombre,
        sku,
        descripcion || null,
        stock_inicial,
        stock_minimo,
        id_categoria,
        fecha_vencimiento || null,
        imageUrl, // URL de Cloudinary o null
        coordenada_x || null,
        coordenada_y || null,
      ]
    );
    const nuevoInsumoId = insumoResult.insertId;

    // 4. Insertar el Movimiento de Entrada
    await connection.query(
      `INSERT INTO MOVIMIENTO (FK_id_insumo, FK_id_usuario, tipo_movimiento, cantidad, fecha_hora, FK_id_documento) 
       VALUES (?, ?, 'Entrada', ?, NOW(), ?)`,
      [nuevoInsumoId, id_usuario_admin, stock_inicial, finalDocumentoId]
    );

    // Confirmar transacción
    await connection.commit();

    res.status(201).json({
      message: "Insumo creado y asociado al documento con éxito",
      id: nuevoInsumoId,
      documentoId: finalDocumentoId, // Devolvemos el ID usado
      imagenUrl: imageUrl,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en createInsumo:", error);

    if (error.code === "ER_DUP_ENTRY") {
      // Como ya manejamos el documento duplicado arriba, si salta este error
      // es casi seguro que es por el SKU o Nombre del INSUMO.
      return res
        .status(400)
        .json({ message: "El SKU o Nombre del insumo ya existe." });
    }

    return res
      .status(500)
      .json({ message: error.message || "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// ---------------------------------------------------------- GET, PUT, ETC. (Resto de funciones)
export const getInsumoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM INSUMO WHERE PK_id_insumo = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateInsumo = async (req, res) => {
  const { id } = req.params;
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
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El SKU o Nombre ingresado ya existe." });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const toggleInsumoActivo = async (req, res) => {
  const { id } = req.params;
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
      message: `Insumo ${nuevoEstado ? "habilitado" : "deshabilitado"
        } con éxito.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getInsumoBySku = async (req, res) => {
  const { sku } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM INSUMO WHERE sku = ? AND activo = 1",
      [sku]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Insumo no encontrado o inactivo" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
