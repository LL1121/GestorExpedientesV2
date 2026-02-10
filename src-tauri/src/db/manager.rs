use sqlx::{Pool, Sqlite, Postgres, sqlite::SqlitePoolOptions, sqlite::SqliteConnectOptions, postgres::PgPoolOptions};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::error::{AppError, Result};
use std::str::FromStr;

/// Configuración de las bases de datos
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    /// Ruta al archivo SQLite local
    pub sqlite_path: String,
    
    /// URL de conexión a PostgreSQL (remoto)
    /// Formato: postgresql://user:password@host:port/database
    pub postgres_url: Option<String>,
    
    /// Número máximo de conexiones en el pool
    pub max_connections: u32,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            sqlite_path: "gestor_irrigacion.db".to_string(),
            postgres_url: None,
            max_connections: 5,
        }
    }
}

/// Manager central de bases de datos
/// Maneja las conexiones a SQLite (local) y PostgreSQL (remoto)
#[derive(Debug)]
pub struct DatabaseManager {
    /// Pool de conexiones a SQLite (siempre disponible, offline-first)
    sqlite: Pool<Sqlite>,
    
    /// Pool de conexiones a PostgreSQL (opcional, solo cuando hay conexión)
    postgres: Arc<RwLock<Option<Pool<Postgres>>>>,
    
    /// Configuración
    config: DatabaseConfig,
}

impl DatabaseManager {
    /// Inicializa el DatabaseManager
    /// 
    /// # Ejemplo
    /// ```rust
    /// let config = DatabaseConfig::default();
    /// let db_manager = DatabaseManager::new(config).await?;
    /// ```
    pub async fn new(config: DatabaseConfig) -> Result<Self> {
        // Crear el pool de SQLite (local)
        eprintln!("🔗 Conectando a SQLite: {}", config.sqlite_path);
        
        // Asegurar que el archivo existe creándolo si es necesario
        let db_path = std::path::Path::new(&config.sqlite_path);
        if let Some(parent) = db_path.parent() {
            if !parent.as_os_str().is_empty() && parent.as_os_str() != std::ffi::OsStr::new(".") {
                eprintln!("📁 Creando directorio del DB: {}", parent.display());
                std::fs::create_dir_all(parent)
                    .map_err(|e| AppError::Internal(format!("No se pudo crear directorio: {}", e)))?;
            }
        }
        
        let sqlite_url = if cfg!(windows) && !config.sqlite_path.starts_with("sqlite:") {
            format!("sqlite:///{}", config.sqlite_path.replace("\\", "/"))
        } else {
            format!("sqlite:{}", config.sqlite_path)
        };
        eprintln!("🔗 URL SQLite: {}", sqlite_url);
        
        // Configurar opciones de conexión SQLite
        let connect_options = SqliteConnectOptions::from_str(&sqlite_url)
            .map_err(|e| AppError::Internal(format!("Error en opciones SQLite: {}", e)))?
            .create_if_missing(true);
        
        let sqlite = SqlitePoolOptions::new()
            .max_connections(config.max_connections)
            .connect_with(connect_options)
            .await
            .map_err(|e| AppError::Database(e))?;

        // Ejecutar migraciones de SQLite
        sqlx::migrate!("./migrations/sqlite")
            .run(&sqlite)
            .await
            .map_err(|e| AppError::Internal(format!("Error en migración SQLite: {}", e)))?;

        // Intentar conectar a PostgreSQL si está configurado
        let postgres = if let Some(ref pg_url) = config.postgres_url {
            match PgPoolOptions::new()
                .max_connections(config.max_connections)
                .connect(pg_url)
                .await
            {
                Ok(pool) => {
                    // Ejecutar migraciones de PostgreSQL
                    sqlx::migrate!("./migrations/postgres")
                        .run(&pool)
                        .await
                        .map_err(|e| AppError::Internal(format!("Error en migración PostgreSQL: {}", e)))?;
                    
                    Some(pool)
                }
                Err(e) => {
                    eprintln!("⚠️ No se pudo conectar a PostgreSQL: {}. Trabajando en modo offline.", e);
                    None
                }
            }
        } else {
            None
        };

        Ok(Self {
            sqlite,
            postgres: Arc::new(RwLock::new(postgres)),
            config,
        })
    }

    /// Obtiene una referencia al pool de SQLite
    /// SQLite es la base de datos principal (offline-first)
    pub fn sqlite(&self) -> &Pool<Sqlite> {
        &self.sqlite
    }

    /// Verifica si PostgreSQL está conectado
    pub async fn is_postgres_connected(&self) -> bool {
        self.postgres.read().await.is_some()
    }

    /// Obtiene una referencia al pool de PostgreSQL (si está disponible)
    pub async fn postgres(&self) -> Option<Pool<Postgres>> {
        self.postgres.read().await.clone()
    }

    /// Intenta reconectar a PostgreSQL
    /// Útil para reintentar la conexión después de perder conectividad
    pub async fn reconnect_postgres(&self) -> Result<bool> {
        if let Some(ref pg_url) = self.config.postgres_url {
            match PgPoolOptions::new()
                .max_connections(self.config.max_connections)
                .connect(pg_url)
                .await
            {
                Ok(pool) => {
                    let mut postgres = self.postgres.write().await;
                    *postgres = Some(pool);
                    println!("✅ Reconectado a PostgreSQL");
                    Ok(true)
                }
                Err(e) => {
                    eprintln!("❌ Error al reconectar a PostgreSQL: {}", e);
                    Ok(false)
                }
            }
        } else {
            Ok(false)
        }
    }

    /// Cierra todas las conexiones
    pub async fn close(&self) {
        self.sqlite.close().await;
        
        if let Some(ref pg_pool) = *self.postgres.read().await {
            pg_pool.close().await;
        }
    }

    /// Ejecuta una operación en ambas bases de datos (dual-write)
    /// Si PostgreSQL falla, la operación en SQLite se mantiene
    /// Retorna (sqlite_success, postgres_success)
    pub async fn dual_execute<F, Fut>(&self, operation: F) -> Result<(bool, bool)>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<()>>,
    {
        // Ejecutar en SQLite (principal)
        let sqlite_result = operation().await;
        let sqlite_success = sqlite_result.is_ok();
        
        // Ejecutar en PostgreSQL (si está disponible)
        let postgres_success = if self.is_postgres_connected().await {
            operation().await.is_ok()
        } else {
            false
        };

        // Si SQLite falló, propagar el error
        sqlite_result?;

        Ok((sqlite_success, postgres_success))
    }
}

/// Función para obtener la configuración desde variables de entorno
pub fn config_from_env() -> DatabaseConfig {
    let sqlite_env = std::env::var("SQLITE_PATH")
        .unwrap_or_else(|_| "gestor_irrigacion.db".to_string());

    let sqlite_path = {
        let path = std::path::PathBuf::from(&sqlite_env);
        if path.is_absolute() {
            path.to_string_lossy().to_string()
        } else {
            // Obtener directorio de ejecución
            let base_dir = std::env::current_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            
            // Crear directorio "data" en el mismo nivel que el ejecutable
            let data_dir = base_dir.join("data");
            eprintln!("📁 Creando directorio de datos: {}", data_dir.display());
            
            if let Err(err) = std::fs::create_dir_all(&data_dir) {
                eprintln!("⚠️ Error al crear carpeta de datos: {}", err);
            }
            
            // Ruta completa del archivo
            let full_path = data_dir.join(&path);
            full_path.to_string_lossy().to_string()
        }
    };

    eprintln!("📁 SQLite path configurada: {}", sqlite_path);

    DatabaseConfig {
        sqlite_path,
        postgres_url: std::env::var("DATABASE_URL").ok(),
        max_connections: std::env::var("MAX_CONNECTIONS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(5),
    }
}
