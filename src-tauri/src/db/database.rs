use sqlx::sqlite::{SqlitePool, SqlitePoolOptions, SqliteConnectOptions};
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::str::FromStr;
use std::path::Path;
use std::fs;
use crate::error::Result;

/// Pool de conexiones SQLite y PostgreSQL
#[derive(Clone)]
pub struct DatabasePool {
    /// Pool SQLite para almacenamiento local offline
    pub sqlite: SqlitePool,
    /// Pool PostgreSQL para sincronización remota (opcional)
    pub postgres: Option<PgPool>,
}

impl DatabasePool {
    /// Inicializa los pools de base de datos
    /// 
    /// # Argumentos
    /// * `sqlite_path` - Ruta al archivo SQLite (ej: "app.db")
    /// * `postgres_url` - URL de conexión PostgreSQL (opcional)
    pub async fn new(sqlite_path: &str, postgres_url: Option<&str>) -> Result<Self> {
        // Inicializar SQLite
        let sqlite = create_sqlite_pool(sqlite_path).await?;
        
        // Inicializar PostgreSQL si la URL está disponible
        let postgres = if let Some(url) = postgres_url {
            match create_postgres_pool(url).await {
                Ok(pool) => Some(pool),
                Err(e) => {
                    eprintln!("⚠️ PostgreSQL no disponible: {}. Usando SQLite en modo offline.", e);
                    None
                }
            }
        } else {
            None
        };

        Ok(DatabasePool { sqlite, postgres })
    }

    /// Verifica si hay conexión PostgreSQL disponible
    pub fn has_postgres(&self) -> bool {
        self.postgres.is_some()
    }

    /// Obtiene referencia al pool PostgreSQL
    pub fn get_postgres(&self) -> Option<&PgPool> {
        self.postgres.as_ref()
    }

    /// Obtiene referencia al pool SQLite
    pub fn get_sqlite(&self) -> &SqlitePool {
        &self.sqlite
    }
}

/// Crea un pool de conexiones SQLite
/// Crea el archivo si no existe y ejecuta las migraciones básicas
async fn create_sqlite_pool(db_path: &str) -> Result<SqlitePool> {
    // Crear directorio si no existe
    if let Some(parent) = Path::new(db_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)?;
        }
    }

    // Configurar opciones de conexión SQLite
    let connect_options = SqliteConnectOptions::from_str(db_path)?
        .create_if_missing(true);

    // Crear pool
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    println!("✓ Pool SQLite inicializado: {}", db_path);

    Ok(pool)
}

/// Crea un pool de conexiones PostgreSQL
async fn create_postgres_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    println!("✓ Pool PostgreSQL inicializado");

    Ok(pool)
}

/// Inicializa las bases de datos y ejecuta migraciones
/// 
/// # Argumentos
/// * `pools` - Pool de conexiones
pub async fn init_databases(pools: &DatabasePool) -> Result<()> {
    // Ejecutar migraciones en SQLite (base de datos local)
    sqlx::migrate!("./migrations")
        .run(&pools.sqlite)
        .await?;

    println!("✓ Migraciones completadas en SQLite");

    // Si PostgreSQL está disponible, ejecutar migraciones allá también
    if let Some(postgres) = &pools.postgres {
        sqlx::migrate!("./migrations")
            .run(postgres)
            .await?;

        println!("✓ Migraciones completadas en PostgreSQL");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_sqlite_pool_creation() {
        let pool = create_sqlite_pool(":memory:").await;
        assert!(pool.is_ok());
    }
}
