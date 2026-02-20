-- Agregar nuevos campos a la tabla expedientes
-- Estos campos son necesarios para expedientes estándar (no pago) y para pago

-- Campos comunes a todos los expedientes
ALTER TABLE expedientes ADD COLUMN archivo TEXT;
ALTER TABLE expedientes ADD COLUMN nro_infogov TEXT;
ALTER TABLE expedientes ADD COLUMN tema TEXT;
ALTER TABLE expedientes ADD COLUMN nro_gde TEXT;
ALTER TABLE expedientes ADD COLUMN fecha_pase TEXT;
ALTER TABLE expedientes ADD COLUMN oficina TEXT;
ALTER TABLE expedientes ADD COLUMN buzon_grupal TEXT;
ALTER TABLE expedientes ADD COLUMN hacer TEXT;
ALTER TABLE expedientes ADD COLUMN resumen TEXT;
ALTER TABLE expedientes ADD COLUMN caratula TEXT;
ALTER TABLE expedientes ADD COLUMN resolucion_nro TEXT;

-- Campos específicos para expedientes de tipo PAGO
ALTER TABLE expedientes ADD COLUMN oc_señor TEXT;
ALTER TABLE expedientes ADD COLUMN oc_domicilio TEXT;
ALTER TABLE expedientes ADD COLUMN oc_cuit TEXT;
ALTER TABLE expedientes ADD COLUMN oc_descripcion_zona TEXT;
ALTER TABLE expedientes ADD COLUMN oc_forma_pago TEXT;
ALTER TABLE expedientes ADD COLUMN oc_plazo_entrega TEXT;
ALTER TABLE expedientes ADD COLUMN factura_path TEXT;

-- Agregar PAGO a los tipos permitidos (si no está ya)
-- Nota: En SQLite, no podemos modificar la constrainta existente directamente
-- Se recomienda revisar la validación en la aplicación o recrear la tabla si es necesario

-- Crear índices adicionales para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_expedientes_archivo ON expedientes(archivo);
CREATE INDEX IF NOT EXISTS idx_expedientes_tema ON expedientes(tema);
CREATE INDEX IF NOT EXISTS idx_expedientes_oficina ON expedientes(oficina);
CREATE INDEX IF NOT EXISTS idx_expedientes_nro_infogov ON expedientes(nro_infogov);
CREATE INDEX IF NOT EXISTS idx_expedientes_nro_gde ON expedientes(nro_gde);
