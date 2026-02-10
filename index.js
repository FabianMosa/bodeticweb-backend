// backend/index.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Rutas
import authRoutes from './routes/auth.routes.js';
import insumoRoutes from './routes/insumo.routes.js';
import categoriaRoutes from './routes/categoria.routes.js';
import movimientoRoutes from './routes/movimiento.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import rolRoutes from './routes/rol.routes.js';
import proveedoresRoutes from './routes/proveedor.routes.js';
import documentoRoutes from './routes/documento.routes.js';

const app = express();

// Configuración CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const corsOptions = {
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200 
};

// Middlewares
app.use(cors(corsOptions)); 
app.use(express.json()); 

// Health check
app.get('/', (req, res) => {
  res.send('API de BodeTIC (v1.0) funcionando 🚀');
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/insumos', insumoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/documentos', documentoRoutes);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
