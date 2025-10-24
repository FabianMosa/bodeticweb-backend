// backend/index.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// --- RUTAS ---
import authRoutes from './routes/auth.routes.js';
import insumoRoutes from './routes/insumo.routes.js';

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// Rutas
app.get('/', (req, res) => {
  res.send('API de BodeTIC funcionando 🚀');
});

// --- AÑADIR ESTA LÍNEA ---
// Cualquier petición que empiece con "/api/auth" será manejada por authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/insumos', insumoRoutes);
// ...otras rutas...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});