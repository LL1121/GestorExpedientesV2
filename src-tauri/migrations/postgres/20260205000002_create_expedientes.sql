-- Tipos ENUM para Expedientes
CREATE TYPE tipo_expediente AS ENUM ('INFOGOV', 'GDE', 'INTERNO', 'OTRO');
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

-- Trigger
CREATE TRIGGER update_expedientes_timestamp
BEFORE UPDATE ON expedientes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
