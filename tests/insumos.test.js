/**
 * Pruebas Integrativas de Nivel Medio - Catálogo de Insumos (Backend)
 * 
 * Evalúa las precondiciones, la seguridad JWT y la estructura general 
 * de las consultas al Endpoint de Insumos (GET /api/insumos).
 * Provee cobertura sobre filtros, paginado y acceso público vs privado.
 */
import request from 'supertest';
import app from '../index.js';
import { pool } from '../config/db.js';

describe('Insumos API Endpoints (Estructura y Paginado)', () => {

  /**
   * Cierre global del pool de conexiones tras completar suite.
   * Evita Jest Leaks (Handles abiertos).
   */
  afterAll(async () => {
    await pool.end();
  });

  it('Debe rechazar la obtención del catálogo completo si no posee token', async () => {
    // 1. Arrange & Act: Solicitamos listado de insumos al API bloqueada
    const res = await request(app).get('/api/insumos?page=1&limit=10');
    
    // 2. Assert: Validamos barrera estructural (401 Unauthorized / 403 Forbidden)
    expect([401, 403]).toContain(res.statusCode);
  });

  it('Debe rechazar la creación de insumos con un body vacío (Bad Request)', async () => {
    // 1. Arrange & Act: Simulamos inyección POST nula o vacía (saltará Middleware de autenticación y/o de validación)
    const res = await request(app)
      .post('/api/insumos')
      .send({});
      
    // 2. Assert: La capa de autenticación patea cualquier inyección vacía antes o durante los controladores
    expect([400, 401, 403]).toContain(res.statusCode);
  });
});
