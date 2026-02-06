-- Tipo ENUM para Vehículos
CREATE TYPE tipo_vehiculo AS ENUM ('AUTO', 'CAMIONETA', 'CAMION', 'UTILITARIO', 'MAQUINARIA', 'OTRO');

-- Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id UUID PRIMARY KEY NOT NULL,
    patente VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    año INTEGER NOT NULL,
    tipo tipo_vehiculo NOT NULL,
    numero_motor VARCHAR(50),
    numero_chasis VARCHAR(50),
    color VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT true,
    kilometraje_actual DOUBLE PRECISION NOT NULL DEFAULT 0,
    capacidad_tanque DOUBLE PRECISION NOT NULL,
    vencimiento_seguro TIMESTAMPTZ,
    vencimiento_vtv TIMESTAMPTZ,
    vencimiento_habilitacion TIMESTAMPTZ,
    area_asignada VARCHAR(100),
    agente_asignado_id UUID,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    FOREIGN KEY (agente_asignado_id) REFERENCES agentes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON vehiculos(patente);
CREATE INDEX IF NOT EXISTS idx_vehiculos_tipo ON vehiculos(tipo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_activo ON vehiculos(activo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_area ON vehiculos(area_asignada);
CREATE INDEX IF NOT EXISTS idx_vehiculos_agente ON vehiculos(agente_asignado_id);

-- Trigger
CREATE TRIGGER update_vehiculos_timestamp
BEFORE UPDATE ON vehiculos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
