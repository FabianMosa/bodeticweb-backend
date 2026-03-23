/**
 * Pruebas Integrativas Críticas - Movimientos de Inventario (Backend)
 * 
 * Este archivo valida la protección de las rutas vitales que modifican la cantidad
 * física de los items en bodega. Garantiza que actores no autorizados no puedan 
 * realizar extracciones ilegítimas.
 */
import request from 'supertest';
import app from '../index.js';
import { pool } from '../config/db.js'; // Importación obligatoria para cierre de open handles

describe('Movimientos Endpoints (Seguridad y JWT)', () => {

  /**
   * Cierre global del pool de base de datos de MySQL para evitar fugas de memoria 
   * (memory leaks) en Jest.
   */
  afterAll(async () => {
    await pool.end();
  });

  it('Debe denegar el acceso (401/403) si no se proporciona un JWT al registrar salida de stock', async () => {
    // 1. Arrange & Act: Simulamos un intento de extracción (POST) sin pasar cabecera 'Authorization'
    const res = await request(app)
      .post('/api/movimientos/salida')
      .send({
        idInsumo: 1,
        cantidad: 5,
        tipo_salida: 'Uso-OT',
        ot_codigo: 'OT-999',
        idUsuario: 1
      });
      
    // 2. Assert: Comprobamos rigurosamente que el servidor patee la petición.
    // 401 significa No Autorizado (falta token), 403 significa Prohibido (rol insuficiente)
    expect([401, 403]).toContain(res.statusCode);
  });
});
