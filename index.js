// backend/index.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// --- RUTAS ---
import authRoutes from './routes/auth.routes.js';
import insumoRoutes from './routes/insumo.routes.js';
import categoriaRoutes from './routes/categoria.routes.js';
import movimientoRoutes from './routes/movimiento.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import rolRoutes from './routes/rol.routes.js';
import proveedoresRoutes from './routes/proveedor.routes.js';

// --- AÑADIR ESTA LÍNEA ---
// Cualquier petición que empiece con "/api/categorias" será manejada por categoriaRoutes

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const corsOptions = {
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200 
};
// Middlewares
app.use(cors(corsOptions)); 

app.use(express.json()); 


// --- AÑADIR ESTA LÍNEA ---
// Cualquier petición que empiece con "/api/auth" será manejada por authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/insumos', insumoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/proveedores', proveedoresRoutes);

// Iniciar el servidor

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});