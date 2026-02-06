-- Tipo ENUM para Combustible
CREATE TYPE tipo_combustible AS ENUM ('NAFTA', 'DIESEL', 'GNC');

-- Tabla de Tickets de Combustible
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY NOT NULL,
    vehiculo_id UUID NOT NULL,
    agente_id UUID NOT NULL,
    fecha_carga TIMESTAMPTZ NOT NULL,
    numero_ticket VARCHAR(50),
    tipo_combustible tipo_combustible NOT NULL,
    litros DOUBLE PRECISION NOT NULL,
    precio_por_litro DOUBLE PRECISION NOT NULL,
    monto_total DOUBLE PRECISION NOT NULL,
    kilometraje DOUBLE PRECISION NOT NULL,
    kilometraje_anterior DOUBLE PRECISION,
    estacion_servicio VARCHAR(200) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
    FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tickets_vehiculo ON tickets(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agente ON tickets(agente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha ON tickets(fecha_carga);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo_combustible ON tickets(tipo_combustible);

-- Trigger
CREATE TRIGGER update_tickets_timestamp
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para establecer kilometraje_anterior automáticamente
CREATE OR REPLACE FUNCTION set_kilometraje_anterior()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.kilometraje_anterior IS NULL THEN
        SELECT kilometraje INTO NEW.kilometraje_anterior
        FROM tickets
        WHERE vehiculo_id = NEW.vehiculo_id
        ORDER BY fecha_carga DESC, created_at DESC
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_kilometraje_anterior_trigger
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_kilometraje_anterior();
