# Backend - API REST BodeTIC

API REST desarrollada con **Node.js** y **Express 5** que provee todos los servicios para el sistema de gestión de inventario BodeTIC. Gestiona autenticación JWT, CRUD de insumos, control de movimientos de stock, usuarios con roles, proveedores, documentos de ingreso y exportación de reportes a Excel.

## Acceso rápido

- Frontend complementario (cliente): [`../bodeticweb-frontend/README.md`](../bodeticweb-frontend/README.md)
- Requisitos mínimos: Node.js LTS + npm + MySQL
- URL local por defecto: `http://localhost:3001`

## Stack Tecnológico

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| express | ^5.1.0 | Framework web |
| mysql2 | ^3.15.3 | Driver MySQL con pool de conexiones |
| jsonwebtoken | ^9.0.2 | Generación y verificación de JWT |
| bcryptjs | ^3.0.2 | Hash de contraseñas |
| cloudinary | ^2.8.0 | Almacenamiento de imágenes en la nube |
| multer | ^2.0.2 | Upload de archivos (memoria) |
| exceljs | ^4.4.0 | Exportación de historial a Excel |
| cors | ^2.8.5 | Configuración CORS |
| dotenv | ^17.2.3 | Variables de entorno |

> Proyecto configurado con **ES Modules** (`"type": "module"` en `package.json`).

## Estructura del Proyecto

```
bodeticweb-backend/
├── config/
│   ├── db.js                   # Pool MySQL (local + Railway)
│   └── cloudinary.js           # Config Cloudinary
├── controllers/
│   ├── auth.controller.js      # Login
│   ├── insumo.controller.js    # CRUD insumos + ubicación visual
│   ├── categoria.controller.js # Categorías
│   ├── movimiento.controller.js# Salida, devolución, préstamos, historial
│   ├── usuario.controller.js   # CRUD usuarios + cambio de contraseña
│   ├── dashboard.controller.js # Alertas de stock
│   ├── rol.contoller.js        # Listado de roles
│   ├── proveedor.controller.js # Listado de proveedores
│   └── documento.controller.js # Búsqueda de documentos
├── middleware/
│   ├── auth.middleware.js      # verifyToken + isAdmin
│   └── upload.middleware.js    # Multer (buffer en memoria)
├── routes/
│   ├── auth.routes.js
│   ├── insumo.routes.js
│   ├── categoria.routes.js
│   ├── movimiento.routes.js
│   ├── usuario.routes.js
│   ├── dashboard.routes.js
│   ├── rol.routes.js
│   ├── proveedor.routes.js
│   └── documento.routes.js
├── models/                     # Vacío (queries directas en controllers)
├── context/
│   └── scripts SQL por tabla (p. ej. `bodega_tic_insumo.sql`)
├── migrations/
│   └── `001_insumo_oculto_app.sql` (ALTER manual opcional; el arranque aplica lo mismo vía `config/ensureInsumoOcultoApp.js` si falta la columna)
├── index.js                    # Punto de entrada
├── package.json
├── .env
└── .gitignore
```

## Variables de Entorno

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos (local)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=****
DB_DATABASE=bodetic
DB_PORT=3306

# Base de datos (Railway - alternativas automáticas)
# MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT

# JWT
JWT_SECRET=****

# Cloudinary
CLOUDINARY_CLOUD_NAME=****
CLOUDINARY_API_KEY=****
CLOUDINARY_API_SECRET=****

# CORS
FRONTEND_URL=http://localhost:5173
```

## Base de Datos

### Esquema de tablas

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| ROL | Roles del sistema | `PK_id_rol`, `nombre_rol` (UNIQUE) |
| USUARIO | Usuarios con roles | `PK_id_usuario`, `FK_id_rol`, `rut` (UNIQUE), `password_hash`, `activo` |
| CATEGORIA | Clasificación de insumos | `PK_id_categoria`, `nombre_categoria` (UNIQUE) |
| PROVEEDOR | Proveedores | `PK_id_proveedor`, `rut_proveedor` (UNIQUE), `nombre_proveedor` |
| INSUMO | Productos del inventario | `PK_id_insumo`, `FK_id_categoria`, `sku` (UNIQUE), `stock_actual`, `stock_minimo`, `imagen_ubicacion`, `coordenada_x/y`, `activo`, `oculto_app` (retirado de la UI sin borrar fila) |
| DOCUMENTO_INGRESO | Facturas/guías | `PK_id_documento`, `FK_id_proveedor`, `codigo_documento` (UNIQUE) |
| HOJA_TERRENO | Órdenes de trabajo (OT) | `PK_id_ot`, `codigo_ot` (UNIQUE) |
| MOVIMIENTO | Historial de movimientos | `PK_id_movimiento`, `FK_id_insumo`, `FK_id_usuario`, `FK_id_ot`, `FK_id_documento`, `tipo_movimiento` (ENUM), `cantidad` |

### Tipos de movimiento (ENUM)
- `Entrada` — Ingreso de stock con documento
- `Salida-Uso` — Egreso vinculado a OT
- `Préstamo` — Egreso sin OT
- `Devolución` — Retorno de préstamo

### Pool de conexiones

```javascript
{
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  acquireTimeout: 10000
}
```

## Autenticación y Seguridad

### Flujo de login
1. `POST /api/auth/login` con `rut` y `password`
2. Validación en BD + comparación con bcrypt (salt: 10)
3. JWT generado con payload `{ id, rol, nombre }` — expira en **8 horas**
4. Mensajes genéricos para evitar enumeración de usuarios

### Middleware

| Middleware | Función |
|------------|---------|
| `verifyToken` | Valida JWT del header `Authorization: Bearer <token>`, inyecta `req.usuario` |
| `isAdmin` | Verifica `req.usuario.rol === 1` |

### CORS en desarrollo local

- El backend acepta los orígenes definidos en `FRONTEND_URL` (soporta múltiples separados por coma).
- Además, en entorno local permite `http://localhost:<puerto>` y `http://127.0.0.1:<puerto>` para evitar bloqueos de preflight cuando Vite cambia de puerto.
- Si modificas `FRONTEND_URL` en `.env`, reinicia el proceso de Node para aplicar cambios.
- Se recomienda ejecutar esta API en `http://localhost:3001` para evitar conflictos con otros proyectos que usan `3000`.

### Roles
- **Rol 1:** Administrador — acceso total
- **Rol 2:** Técnico/Usuario — acceso limitado (lectura, salidas de stock)

## Endpoints de la API

### Health Check
- `GET /` → `"API de BodeTIC (v1.0) funcionando 🚀"`

### Auth — `/api/auth`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| POST | `/login` | — | Autenticación (rut + password) |

### Insumos — `/api/insumos`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/` | verifyToken | Listar insumos (paginado + filtros) |
| GET | `/:id` | verifyToken | Obtener insumo por ID (incluye `nombre_categoria` y último `codigo_documento` del insumo) |
| GET | `/sku/:sku` | verifyToken | Buscar por SKU |
| POST | `/` | verifyToken, isAdmin, upload | Crear insumo (con imagen + documento) |
| PUT | `/:id` | verifyToken, isAdmin | Actualizar insumo |
| PUT | `/:id/toggle-activo` | verifyToken, isAdmin | Activar/Desactivar (soft delete) |
| PUT | `/:id/ocultar-app` | verifyToken, isAdmin | Retirar de listados y escáner (papelera); no borra en BD |

> Si el front muestra **«Ruta no encontrada»** (404) al usar *ocultar-app*, el proceso de Node suele estar ejecutando código antiguo: detén y vuelve a iniciar el backend (`npm run dev` o `node index.js`) tras actualizar el repositorio.
| PUT | `/:id/ubicacion` | verifyToken, isAdmin, upload | Actualizar ubicación visual |

**Query params (GET /):** `activo` (true/false/all), `categoria`, `search`, `page` (default: 1), `limit` (default: 15)

### Movimientos — `/api/movimientos`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| POST | `/salida` | verifyToken | Registrar salida (Uso o Préstamo) |
| POST | `/devolucion` | verifyToken, isAdmin | Registrar devolución |
| GET | `/prestamos` | verifyToken | Préstamos activos con pendientes |
| GET | `/historial` | verifyToken, isAdmin | Historial filtrado + export Excel (incluye `codigo_documento`; para salidas sin documento usa el de entrada del insumo; permite filtrar por número de documento) |

**Query params (GET /historial):** `fecha_inicio`, `fecha_fin`, `id_categoria`, `id_usuario`, `tipo_movimiento`, `codigo_documento`, `formato` (json/excel), `page`, `limit`

### Usuarios — `/api/usuarios`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/tecnicos` | verifyToken, isAdmin | Técnicos activos |
| GET | `/` | verifyToken, isAdmin | Todos los usuarios |
| GET | `/:id` | verifyToken, isAdmin | Usuario por ID |
| POST | `/` | verifyToken, isAdmin | Crear usuario |
| PUT | `/:id` | verifyToken, isAdmin | Actualizar usuario |
| PUT | `/:id/change-password` | verifyToken, isAdmin | Cambiar contraseña |

### Categorías — `/api/categorias`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/` | verifyToken | Listar categorías |

### Proveedores — `/api/proveedores`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/` | verifyToken, isAdmin | Listar proveedores |

### Documentos — `/api/documentos`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/buscar/:codigo` | verifyToken, isAdmin | Buscar documento por código |

### Dashboard — `/api/dashboard`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/alertas` | verifyToken, isAdmin | Alertas de stock bajo y próximos a vencer |

### Roles — `/api/roles`
| Método | Endpoint | Middleware | Descripción |
|--------|----------|------------|-------------|
| GET | `/` | verifyToken, isAdmin | Listar roles disponibles |

## Formato de Respuestas

### Paginación
```json
{
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 73
  }
}
```

### Errores
```json
{
  "message": "Descripción del error",
  "stack": "..." // Solo en development
}
```

| Código | Significado |
|--------|-------------|
| 400 | Datos inválidos o duplicados |
| 401 | Sin token o credenciales inválidas |
| 403 | Sin permisos suficientes |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## Funcionalidades Clave

- **Transacciones MySQL** para operaciones críticas (crear insumo = imagen + documento + insumo + movimiento)
- **Soft delete** con campo `activo` (insumos y usuarios no se eliminan)
- **Retiro de UI** — campo `oculto_app` en `INSUMO`: insumos en papelera pueden ocultarse de la aplicación sin borrar la fila (trazabilidad de movimientos). En el arranque (no en tests) se ejecuta `ensureInsumoOcultoAppColumn()` para añadir la columna si no existe; alternativa manual: `migrations/001_insumo_oculto_app.sql`.
- **Documentos reutilizables** — se detectan y reutilizan por código automáticamente
- **Ubicación visual** — sistema de coordenadas X/Y sobre imagen para localizar insumos en bodega
- **Exportación Excel** — historial de movimientos exportable a `.xlsx` con ExcelJS
- **Imágenes en Cloudinary** — carpeta `bodetic_insumos`, subidas mediante buffer (Multer)
- **Soporte Railway** — variables de entorno alternativas para despliegue en Railway

## Scripts

```bash
npm install    # Instalar dependencias
npm run dev    # Desarrollo con nodemon
npm start      # Producción
```

### Ejecución local independiente

Este backend está documentado para ejecutarse de forma independiente dentro de su propio repositorio/directorio:

```bash
npm install
npm run dev
```

> Verifica que `.env` tenga `PORT`, credenciales de base de datos, `JWT_SECRET` y `FRONTEND_URL` correctamente configurados.

## Despliegue

El proyecto está preparado para **Railway** (Node.js + MySQL). Se requiere configurar las variables de entorno correspondientes en el dashboard de Railway.
