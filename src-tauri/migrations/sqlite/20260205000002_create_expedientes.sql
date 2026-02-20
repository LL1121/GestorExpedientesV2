-- Tabla de Expedientes
CREATE TABLE IF NOT EXISTS expedientes (
    id TEXT PRIMARY KEY NOT NULL,
    numero TEXT NOT NULL,
    año INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('INFOGOV', 'GDE', 'INTERNO', 'PAGO', 'OTRO')),
    asunto TEXT NOT NULL,
    descripcion TEXT,
    area_responsable TEXT NOT NULL,
    prioridad TEXT NOT NULL CHECK(prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')),
    estado TEXT NOT NULL CHECK(estado IN ('INICIADO', 'EN_PROCESO', 'EN_REVISION', 'OBSERVADO', 'FINALIZADO', 'ARCHIVADO')),
    fecha_inicio TEXT NOT NULL,
    fecha_vencimiento TEXT,
    fecha_finalizacion TEXT,
    agente_responsable_id TEXT,
    archivos_adjuntos TEXT,
    observaciones TEXT,
    
    -- Campos comunes a todos los expedientes
    archivo TEXT,
    nro_infogov TEXT,
    tema TEXT,
    nro_gde TEXT,
    fecha_pase TEXT,
    oficina TEXT,
    buzon_grupal TEXT,
    hacer TEXT,
    resumen TEXT,
    caratula TEXT,
    resolucion_nro TEXT,
    
    -- Campos específicos para expedientes de tipo PAGO
    oc_señor TEXT,
    oc_domicilio TEXT,
    oc_cuit TEXT,
    oc_descripcion_zona TEXT,
    oc_forma_pago TEXT,
    oc_plazo_entrega TEXT,
    factura_path TEXT,
    
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
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

-- Trigger para actualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_expedientes_timestamp 
AFTER UPDATE ON expedientes
FOR EACH ROW
BEGIN
    UPDATE expedientes SET updated_at = datetime('now') WHERE id = NEW.id;
END;
