-- Tabla de Agentes (Personal) para PostgreSQL
CREATE TABLE IF NOT EXISTS agentes (
    id UUID PRIMARY KEY NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    legajo VARCHAR(50) NOT NULL UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    fecha_ingreso TIMESTAMPTZ NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    licencia_conducir VARCHAR(50),
    vencimiento_licencia TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agentes_dni ON agentes(dni);
CREATE INDEX IF NOT EXISTS idx_agentes_legajo ON agentes(legajo);
CREATE INDEX IF NOT EXISTS idx_agentes_activo ON agentes(activo);
CREATE INDEX IF NOT EXISTS idx_agentes_area ON agentes(area);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_agentes_timestamp
BEFORE UPDATE ON agentes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
