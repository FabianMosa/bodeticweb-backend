/**
 * Pruebas Integrativas Críticas - Autenticación (Backend)
 * 
 * Este archivo valida los flujos de seguridad principales para el inicio de sesión.
 * Utilizamos `supertest` para simular llamadas HTTP reales al servidor Express sin necesidad
 * de levantar la aplicación en un puerto físico.
 */
import request from 'supertest';
import app from '../index.js';
import { pool } from '../config/db.js'; // Importamos el pool de DB local

describe('Auth Endpoints (Integración de Seguridad)', () => {

  /**
   * Hook teardown: Es CRÍTICO cerrar el pool de conexiones luego de ejecutar
   * los tests. Si no se hace, Jest quedará "colgado" escuchando la BD activa
   * provocando el error "A worker process has failed to exit gracefully".
   */
  afterAll(async () => {
    await pool.end();
  });

  it('Debería retornar un estado de error (401/404) para credenciales inválidas', async () => {
    // 1. Arrange & Act: Simulamos un POST al endpoint de login con RUT/Password que no existen
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        rut: '11.111.111-1',
        password: 'wrongpassword' // Contraseña errónea a propósito
      });
    
    // 2. Assert: Validamos que NUNCA devuelva 200 (OK) previniendo una brecha de seguridad
    expect(res.statusCode).not.toBe(200);
    // Verificamos que la API devuelva una respuesta estructurada advirtiendo del error
    expect(res.body).toHaveProperty('message');
  });
  
  it('El Health check raíz debe retornar 200 y el mensaje de estado activo', async () => {
    // 1. Act: Consultamos la raíz de la API (Health check)
    const res = await request(app).get('/');
    
    // 2. Assert: El servicio debe estar vivo y devolver status correcto HTTP 200
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('API de BodeTIC');
  });
});
