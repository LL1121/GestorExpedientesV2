// Módulo de gestión de bases de datos
// Maneja la conexión dual SQLite (local) + PostgreSQL (remoto)

pub mod manager;
pub mod migrations;

pub use manager::{DatabaseManager, DatabaseConfig, config_from_env};
