-- Tabla de Tickets de Combustible
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY NOT NULL,
    vehiculo_id TEXT NOT NULL,
    agente_id TEXT NOT NULL,
    fecha_carga TEXT NOT NULL,
    numero_ticket TEXT,
    tipo_combustible TEXT NOT NULL CHECK(tipo_combustible IN ('NAFTA', 'DIESEL', 'GNC')),
    litros REAL NOT NULL,
    precio_por_litro REAL NOT NULL,
    monto_total REAL NOT NULL,
    kilometraje REAL NOT NULL,
    kilometraje_anterior REAL,
    estacion_servicio TEXT NOT NULL,
    localidad TEXT NOT NULL,
    observaciones TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
    FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas de rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_vehiculo ON tickets(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agente ON tickets(agente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha ON tickets(fecha_carga);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo_combustible ON tickets(tipo_combustible);

-- Trigger para actualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_tickets_timestamp 
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
    UPDATE tickets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para actualizar kilometraje_anterior automáticamente
-- Se ejecuta antes de insertar un nuevo ticket
CREATE TRIGGER IF NOT EXISTS set_kilometraje_anterior
BEFORE INSERT ON tickets
FOR EACH ROW
BEGIN
    UPDATE tickets 
    SET kilometraje_anterior = (
        SELECT kilometraje 
        FROM tickets 
        WHERE vehiculo_id = NEW.vehiculo_id 
        ORDER BY fecha_carga DESC, created_at DESC 
        LIMIT 1
    )
    WHERE id = NEW.id;
END;
