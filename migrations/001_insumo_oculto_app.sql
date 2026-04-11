-- Oculta insumos de la UI sin borrar filas (trazabilidad de movimientos).
-- Ejecutar una vez en bases existentes: mysql -u ... bodetic < migrations/001_insumo_oculto_app.sql

ALTER TABLE INSUMO
  ADD COLUMN oculto_app TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = retirado de listados y escáner; fila conservada en BD'
  AFTER activo;
