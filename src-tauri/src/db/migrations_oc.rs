// Migraciones para el sistema de Órdenes de Compra
use sqlx::{SqlitePool, PgPool};
use crate::error::Result;

/// Ejecuta las migraciones del sistema de OC en SQLite
pub async fn run_sqlite_oc_migrations(pool: &SqlitePool) -> Result<()> {
    // Tabla proveedores
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS proveedores (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            cuit TEXT UNIQUE NOT NULL,
            domicilio TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;

    // Actualizar tabla expedientes (agregar campos si no existen)
    sqlx::query("ALTER TABLE expedientes ADD COLUMN nro_infogov TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN nro_gde TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN caratula TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN resolucion_nro TEXT")
        .execute(pool)
        .await
        .ok();

    // Tabla config_topes
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS config_topes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_contratacion TEXT NOT NULL UNIQUE,
            monto_maximo REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;

    // Insertar valores por defecto (montos en ARS 2026)
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO config_topes (tipo_contratacion, monto_maximo) VALUES
            ('Contratación directa', 5000000.00),
            ('Contratación directa con publicación', 15000000.00),
            ('Licitación pública de menor monto', 50000000.00),
            ('Licitación pública de mayor monto', 999999999.99)
        "#
    )
    .execute(pool)
    .await?;

    // Tabla ordenes_compra
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ordenes_compra (
            id TEXT PRIMARY KEY,
            numero_oc TEXT NOT NULL,
            pedido_nro INTEGER NOT NULL,
            destino TEXT NOT NULL DEFAULT 'ZONA RIEGO MALARGUE',
            fecha TEXT NOT NULL,
            expediente_id TEXT NOT NULL,
            resolucion_nro TEXT,
            forma_pago TEXT NOT NULL,
            plazo_entrega TEXT NOT NULL DEFAULT '-',
            es_iva_inscripto INTEGER NOT NULL DEFAULT 1,
            tipo_contratacion TEXT NOT NULL,
            subtotal REAL NOT NULL,
            iva REAL NOT NULL,
            total REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT
        )
        "#
    )
    .execute(pool)
    .await?;

    // Tabla orden_compra_renglones
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS orden_compra_renglones (
            id TEXT PRIMARY KEY,
            oc_id TEXT NOT NULL,
            renglon_nro INTEGER NOT NULL,
            cantidad REAL NOT NULL,
            detalle TEXT NOT NULL,
            marca TEXT,
            valor_unitario REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (oc_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE
        )
        "#
    )
    .execute(pool)
    .await?;

    // Índices para performance
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_proveedores_cuit ON proveedores(cuit)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_expedientes_infogov ON expedientes(nro_infogov)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_oc_numero ON ordenes_compra(numero_oc)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_oc_fecha ON ordenes_compra(fecha)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_renglones_oc ON orden_compra_renglones(oc_id)")
        .execute(pool)
        .await?;

    println!("✅ Migraciones de OC ejecutadas en SQLite");
    Ok(())
}

/// Ejecuta las migraciones del sistema de OC en PostgreSQL
pub async fn run_postgres_oc_migrations(pool: &PgPool) -> Result<()> {
    // Tabla proveedores
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS proveedores (
            id UUID PRIMARY KEY,
            nombre TEXT NOT NULL,
            cuit TEXT UNIQUE NOT NULL,
            domicilio TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;

    // Agregar columnas a expedientes si no existen
    sqlx::query(
        r#"
        ALTER TABLE expedientes 
        ADD COLUMN IF NOT EXISTS nro_infogov TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS nro_gde TEXT,
        ADD COLUMN IF NOT EXISTS caratula TEXT,
        ADD COLUMN IF NOT EXISTS resolucion_nro TEXT
        "#
    )
    .execute(pool)
    .await.ok(); // Ignorar si ya existen

    // Tabla config_topes
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS config_topes (
            id SERIAL PRIMARY KEY,
            tipo_contratacion TEXT NOT NULL UNIQUE,
            monto_maximo DECIMAL(15, 2) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;

    // Insertar valores por defecto
    sqlx::query(
        r#"
        INSERT INTO config_topes (tipo_contratacion, monto_maximo) VALUES
            ('Contratación directa', 5000000.00),
            ('Contratación directa con publicación', 15000000.00),
            ('Licitación pública de menor monto', 50000000.00),
            ('Licitación pública de mayor monto', 999999999.99)
        ON CONFLICT (tipo_contratacion) DO NOTHING
        "#
    )
    .execute(pool)
    .await?;

    // Tabla ordenes_compra
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ordenes_compra (
            id UUID PRIMARY KEY,
            numero_oc TEXT NOT NULL,
            pedido_nro SERIAL NOT NULL,
            destino TEXT NOT NULL DEFAULT 'ZONA RIEGO MALARGUE',
            fecha DATE NOT NULL DEFAULT CURRENT_DATE,
            expediente_id UUID NOT NULL,
            resolucion_nro TEXT,
            forma_pago TEXT NOT NULL,
            plazo_entrega TEXT NOT NULL DEFAULT '-',
            es_iva_inscripto BOOLEAN NOT NULL DEFAULT TRUE,
            tipo_contratacion TEXT NOT NULL,
            subtotal DECIMAL(15, 2) NOT NULL,
            iva DECIMAL(15, 2) NOT NULL,
            total DECIMAL(15, 2) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT
        )
        "#
    )
    .execute(pool)
    .await?;

    // Tabla orden_compra_renglones
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS orden_compra_renglones (
            id UUID PRIMARY KEY,
            oc_id UUID NOT NULL,
            renglon_nro INTEGER NOT NULL,
            cantidad DECIMAL(10, 2) NOT NULL,
            detalle TEXT NOT NULL,
            marca TEXT,
            valor_unitario DECIMAL(15, 2) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (oc_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE
        )
        "#
    )
    .execute(pool)
    .await?;

    // Índices
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_proveedores_cuit ON proveedores(cuit)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_expedientes_infogov ON expedientes(nro_infogov)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_oc_numero ON ordenes_compra(numero_oc)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_oc_fecha ON ordenes_compra(fecha)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_renglones_oc ON orden_compra_renglones(oc_id)")
        .execute(pool)
        .await?;

    println!("✅ Migraciones de OC ejecutadas en PostgreSQL");
    Ok(())
}
