// Sistema de errores personalizado para la aplicación
// Usamos thiserror para definir errores de forma limpia

use thiserror::Error;
use std::io;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Error de base de datos: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Error de migración: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),
    
    #[error("Error de sincronización: {0}")]
    Sync(String),
    
    #[error("Recurso no encontrado: {0}")]
    NotFound(String),
    
    #[error("Error de validación: {0}")]
    Validation(String),
    
    #[error("Error de I/O: {0}")]
    Io(#[from] io::Error),
    
    #[error("Error general: {0}")]
    Internal(String),
}

// Convertir AppError a String para Tauri (commands deben retornar Result<T, String>)
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;

