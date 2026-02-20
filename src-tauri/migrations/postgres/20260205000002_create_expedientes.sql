-- Tipos ENUM para Expedientes
CREATE TYPE tipo_expediente AS ENUM ('INFOGOV', 'GDE', 'INTERNO', 'PAGO', 'OTRO');
CREATE TYPE prioridad AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');
CREATE TYPE estado_expediente AS ENUM ('INICIADO', 'EN_PROCESO', 'EN_REVISION', 'OBSERVADO', 'FINALIZADO', 'ARCHIVADO');

-- Tabla de Expedientes
CREATE TABLE IF NOT EXISTS expedientes (
    id UUID PRIMARY KEY NOT NULL,
    numero VARCHAR(100) NOT NULL,
    año INTEGER NOT NULL,
    tipo tipo_expediente NOT NULL,
    asunto TEXT NOT NULL,
    descripcion TEXT,
    area_responsable VARCHAR(100) NOT NULL,
    prioridad prioridad NOT NULL,
    estado estado_expediente NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_vencimiento TIMESTAMPTZ,
    fecha_finalizacion TIMESTAMPTZ,
    agente_responsable_id UUID,
    archivos_adjuntos JSONB,
    observaciones TEXT,
    
    -- Campos comunes a todos los expedientes
    archivo VARCHAR(255),
    nro_infogov VARCHAR(50),
    tema TEXT,
    nro_gde VARCHAR(50),
    fecha_pase TIMESTAMPTZ,
    oficina VARCHAR(100),
    buzon_grupal VARCHAR(100),
    hacer TEXT,
    resumen TEXT,
    caratula TEXT,
    resolucion_nro VARCHAR(50),
    
    -- Campos específicos para expedientes de tipo PAGO
    oc_señor TEXT,
    oc_domicilio TEXT,
    oc_cuit VARCHAR(20),
    oc_descripcion_zona TEXT,
    oc_forma_pago VARCHAR(100),
    oc_plazo_entrega VARCHAR(100),
    factura_path TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    FOREIGN KEY (agente_responsable_id) REFERENCES agentes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expedientes_numero ON expedientes(numero, año);
CREATE INDEX IF NOT EXISTS idx_expedientes_tipo ON expedientes(tipo);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_expedientes_prioridad ON expedientes(prioridad);
CREATE INDEX IF NOT EXISTS idx_expedientes_area ON expedientes(area_responsable);
CREATE INDEX IF NOT EXISTS idx_expedientes_agente ON expedientes(agente_responsable_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_archivo ON expedientes(archivo);
CREATE INDEX IF NOT EXISTS idx_expedientes_tema ON expedientes(tema);
CREATE INDEX IF NOT EXISTS idx_expedientes_oficina ON expedientes(oficina);
CREATE INDEX IF NOT EXISTS idx_expedientes_nro_infogov ON expedientes(nro_infogov);
CREATE INDEX IF NOT EXISTS idx_expedientes_nro_gde ON expedientes(nro_gde);

-- Trigger
CREATE TRIGGER update_expedientes_timestamp
BEFORE UPDATE ON expedientes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
