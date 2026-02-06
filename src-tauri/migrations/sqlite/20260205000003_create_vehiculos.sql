-- Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id TEXT PRIMARY KEY NOT NULL,
    patente TEXT NOT NULL UNIQUE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    año INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('AUTO', 'CAMIONETA', 'CAMION', 'UTILITARIO', 'MAQUINARIA', 'OTRO')),
    numero_motor TEXT,
    numero_chasis TEXT,
    color TEXT,
    activo INTEGER NOT NULL DEFAULT 1,
    kilometraje_actual REAL NOT NULL DEFAULT 0,
    capacidad_tanque REAL NOT NULL,
    vencimiento_seguro TEXT,
    vencimiento_vtv TEXT,
    vencimiento_habilitacion TEXT,
    area_asignada TEXT,
    agente_asignado_id TEXT,
    observaciones TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    FOREIGN KEY (agente_asignado_id) REFERENCES agentes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON vehiculos(patente);
CREATE INDEX IF NOT EXISTS idx_vehiculos_tipo ON vehiculos(tipo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_activo ON vehiculos(activo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_area ON vehiculos(area_asignada);
CREATE INDEX IF NOT EXISTS idx_vehiculos_agente ON vehiculos(agente_asignado_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_vehiculos_timestamp 
AFTER UPDATE ON vehiculos
FOR EACH ROW
BEGIN
    UPDATE vehiculos SET updated_at = datetime('now') WHERE id = NEW.id;
END;
