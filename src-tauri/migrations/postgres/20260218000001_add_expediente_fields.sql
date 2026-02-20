-- Agregar nuevos campos a la tabla expedientes
-- Estos campos son necesarios para expedientes estándar (no pago) y para pago

-- Campos comunes a todos los expedientes
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS archivo TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS nro_infogov TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS tema TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS nro_gde TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS fecha_pase TIMESTAMPTZ;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oficina TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS buzon_grupal TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS hacer TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS resumen TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS caratula TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS resolucion_nro TEXT;

-- Campos específicos para expedientes de tipo PAGO
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oc_señor TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oc_domicilio TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oc_cuit TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oc_descripcion_zona TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oc_forma_pago TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS oc_plazo_entrega TEXT;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS factura_path TEXT;

-- Crear índices adicionales para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_expedientes_archivo ON expedientes(archivo);
CREATE INDEX IF NOT EXISTS idx_expedientes_tema ON expedientes(tema);
CREATE INDEX IF NOT EXISTS idx_expedientes_oficina ON expedientes(oficina);
CREATE INDEX IF NOT EXISTS idx_expedientes_nro_infogov ON expedientes(nro_infogov);
CREATE INDEX IF NOT EXISTS idx_expedientes_nro_gde ON expedientes(nro_gde);
