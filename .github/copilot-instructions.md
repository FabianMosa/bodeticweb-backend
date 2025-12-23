# AI Coding Instructions for BodeTIC Backend

## Architecture Overview
Node.js/Express REST API for warehouse inventory management. Uses MySQL database with direct SQL queries (no ORM). Key modules:
- **Routes**: REST endpoints in `routes/` (e.g., `insumo.routes.js`)
- **Controllers**: Business logic in `controllers/` (e.g., `insumo.controller.js`)
- **Middleware**: Auth (`auth.middleware.js`) with JWT verification
- **Config**: DB connection pool in `config/db.js`

## Data Flow & Database Integration
- **Database**: MySQL with connection pool supporting Railway (prod) and local env vars
- **Auth**: JWT with 8h expiration, includes `rol` in payload (1=Admin)
- **Queries**: Direct SQL with JOINs, filters, pagination
- **Pagination**: `page`/`limit` params, return `{ data, pagination }`

Example controller method:
```javascript
export const getInsumos = async (req, res) => {
  const { activo = 'true', categoria, search, page = 1, limit = 9 } = req.query;
  const offset = (page - 1) * limit;
  // Build query with filters, execute with pool.query()
  // Return paginated results
};
```

## Developer Workflows
- **Development**: `npm run dev` (Nodemon on port 3000)
- **Start**: `npm run start` (Node production)
- **Environment**: Use `.env` for `JWT_SECRET`, DB credentials
- **CORS**: Configured for frontend URL (`FRONTEND_URL` env var)

Backend runs on port 3000 by default.

## Code Conventions
- **Language**: Spanish table/column names (e.g., `INSUMO`, `FK_id_categoria`)
- **Auth**: `verifyToken` middleware for protected routes, `isAdmin` for admin-only
- **Error Handling**: Return JSON `{ message }` with appropriate status codes
- **Imports**: ES modules (`import/export`)
- **SQL**: Parameterized queries to prevent injection

Example route:
```javascript
app.use('/api/insumos', insumoRoutes); // In index.js
// Routes use controllers with auth middleware
```

## Key Files
- `index.js`: App setup, routes, CORS
- `controllers/insumo.controller.js`: CRUD with filters/pagination
- `middleware/auth.middleware.js`: JWT verification, role checks
- `config/db.js`: MySQL pool configuration

Maintain direct SQL patterns, ensure pagination matches frontend (limit=9), use Spanish DB schema.</content>
<parameter name="filePath">c:\Users\USUARIO\Documents\Bodeticweb\bodeticweb-backend\.github\copilot-instructions.md