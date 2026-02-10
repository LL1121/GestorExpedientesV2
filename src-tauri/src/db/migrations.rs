use sqlx::SqlitePool;
use crate::error::Result;

/// Ejecuta las migraciones de base de datos SQLite
pub async fn run_sqlite_migrations(pool: &SqlitePool) -> Result<()> {
    // Tabla de expedientes
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS expedientes (
            id TEXT PRIMARY KEY,
            numero INTEGER NOT NULL,
            año INTEGER NOT NULL,
            asunto TEXT NOT NULL,
            descripcion TEXT,
            tipo TEXT NOT NULL,
            estado TEXT NOT NULL,
            area TEXT,
            solicitante TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Tabla de agentes
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS agentes (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            dni TEXT UNIQUE NOT NULL,
            legajo TEXT UNIQUE NOT NULL,
            area TEXT NOT NULL,
            tipo_licencia TEXT,
            fecha_vencimiento_licencia DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Tabla de vehículos
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS vehiculos (
            id TEXT PRIMARY KEY,
            patente TEXT UNIQUE NOT NULL,
            tipo TEXT NOT NULL,
            marca TEXT NOT NULL,
            modelo TEXT NOT NULL,
            año INTEGER NOT NULL,
            kilometraje INTEGER DEFAULT 0,
            estado TEXT DEFAULT 'Activo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Tabla de tickets de combustible
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tickets_combustible (
            id TEXT PRIMARY KEY,
            vehiculo_id TEXT NOT NULL,
            fecha DATE NOT NULL,
            litros REAL NOT NULL,
            precio_total REAL NOT NULL,
            kilometraje_actual INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Tabla de consumibles
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS consumibles (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            categoria TEXT NOT NULL,
            cantidad REAL NOT NULL,
            unidad TEXT DEFAULT 'Unidad',
            stock_minimo INTEGER DEFAULT 10,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Crear índices para mejorar performance
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_expedientes_tipo ON expedientes(tipo)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_agentes_legajo ON agentes(legajo)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON vehiculos(patente)")
        .execute(pool)
        .await?;

    println!("✓ Migraciones SQLite completadas");

    Ok(())
}
