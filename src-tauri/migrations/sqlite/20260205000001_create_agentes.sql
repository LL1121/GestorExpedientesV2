-- Tabla de Agentes (Personal)
CREATE TABLE IF NOT EXISTS agentes (
    id TEXT PRIMARY KEY NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    legajo TEXT NOT NULL UNIQUE,
    cargo TEXT NOT NULL,
    area TEXT NOT NULL,
    fecha_ingreso TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1,
    licencia_conducir TEXT,
    vencimiento_licencia TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_agentes_dni ON agentes(dni);
CREATE INDEX IF NOT EXISTS idx_agentes_legajo ON agentes(legajo);
CREATE INDEX IF NOT EXISTS idx_agentes_activo ON agentes(activo);
CREATE INDEX IF NOT EXISTS idx_agentes_area ON agentes(area);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER IF NOT EXISTS update_agentes_timestamp 
AFTER UPDATE ON agentes
FOR EACH ROW
BEGIN
    UPDATE agentes SET updated_at = datetime('now') WHERE id = NEW.id;
END;
