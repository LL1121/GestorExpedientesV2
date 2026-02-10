use sqlx::SqlitePool;
use crate::error::Result;

/// Ejecuta las migraciones de base de datos SQLite
pub async fn run_sqlite_migrations(pool: &SqlitePool) -> Result<()> {
    // Tabla de expedientes
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS expedientes (
            id TEXT PRIMARY KEY,
            numero TEXT NOT NULL,
            año INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            asunto TEXT NOT NULL,
            descripcion TEXT,
            area_responsable TEXT NOT NULL DEFAULT 'Sin definir',
            prioridad TEXT NOT NULL DEFAULT 'MEDIA',
            estado TEXT NOT NULL DEFAULT 'INICIADO',
            fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_vencimiento DATETIME,
            fecha_finalizacion DATETIME,
            agente_responsable_id TEXT,
            archivos_adjuntos TEXT,
            observaciones TEXT,
            synced_at DATETIME,
            nro_infogov TEXT,
            nro_gde TEXT,
            caratula TEXT,
            resolucion_nro TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Asegurar columnas nuevas en instalaciones existentes
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
    sqlx::query("ALTER TABLE expedientes ADD COLUMN area_responsable TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN prioridad TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN estado TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN fecha_inicio DATETIME")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN fecha_vencimiento DATETIME")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN fecha_finalizacion DATETIME")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN agente_responsable_id TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN archivos_adjuntos TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN observaciones TEXT")
        .execute(pool)
        .await
        .ok();
    sqlx::query("ALTER TABLE expedientes ADD COLUMN synced_at DATETIME")
        .execute(pool)
        .await
        .ok();

    // Normalizar valores nulos para columnas obligatorias
    sqlx::query("UPDATE expedientes SET area_responsable = 'Sin definir' WHERE area_responsable IS NULL")
        .execute(pool)
        .await
        .ok();
    sqlx::query("UPDATE expedientes SET prioridad = 'MEDIA' WHERE prioridad IS NULL")
        .execute(pool)
        .await
        .ok();
    sqlx::query("UPDATE expedientes SET estado = 'INICIADO' WHERE estado IS NULL")
        .execute(pool)
        .await
        .ok();
    sqlx::query("UPDATE expedientes SET fecha_inicio = COALESCE(fecha_inicio, created_at, CURRENT_TIMESTAMP) WHERE fecha_inicio IS NULL")
        .execute(pool)
        .await
        .ok();

    // Normalizar enums a SCREAMING_SNAKE_CASE para evitar errores de decode
    sqlx::query("UPDATE expedientes SET tipo = UPPER(tipo) WHERE tipo IS NOT NULL")
        .execute(pool)
        .await
        .ok();
    sqlx::query("UPDATE expedientes SET prioridad = UPPER(prioridad) WHERE prioridad IS NOT NULL")
        .execute(pool)
        .await
        .ok();
    sqlx::query("UPDATE expedientes SET estado = UPPER(estado) WHERE estado IS NOT NULL")
        .execute(pool)
        .await
        .ok();

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
