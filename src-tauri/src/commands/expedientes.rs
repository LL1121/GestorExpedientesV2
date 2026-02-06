// Tauri Commands para Expedientes
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;
use uuid::Uuid;
use std::sync::Arc;

use crate::db::DatabaseManager;
use crate::models::expediente::{Expediente, CreateExpediente, UpdateExpediente};
use crate::repositories::ExpedienteRepository;

/// Obtener todos los expedientes
#[tauri::command]
pub async fn get_expedientes(db: State<'_, Arc<DatabaseManager>>) -> Result<Vec<Expediente>, String> {
    let pool = db.sqlite();
    ExpedienteRepository::get_all(pool)
        .await
        .map_err(|e| e.to_string())
}

/// Obtener un expediente por ID
#[tauri::command]
pub async fn get_expediente(db: State<'_, Arc<DatabaseManager>>, id: String) -> Result<Expediente, String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    ExpedienteRepository::get_by_id(pool, uuid)
        .await
        .map_err(|e| e.to_string())
}

/// Crear un nuevo expediente
#[tauri::command]
pub async fn create_expediente(
    db: State<'_, Arc<DatabaseManager>>,
    data: CreateExpediente
) -> Result<Expediente, String> {
    let pool = db.sqlite();
    ExpedienteRepository::create(pool, data)
        .await
        .map_err(|e| e.to_string())
}

/// Actualizar un expediente existente
#[tauri::command]
pub async fn update_expediente(
    db: State<'_, Arc<DatabaseManager>>,
    id: String,
    data: UpdateExpediente
) -> Result<Expediente, String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    ExpedienteRepository::update(pool, uuid, data)
        .await
        .map_err(|e| e.to_string())
}

/// Eliminar un expediente
#[tauri::command]
pub async fn delete_expediente(
    db: State<'_, Arc<DatabaseManager>>,
    id: String
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    ExpedienteRepository::delete(pool, uuid)
        .await
        .map_err(|e| e.to_string())
}

/// Buscar expedientes por texto
#[tauri::command]
pub async fn search_expedientes(
    db: State<'_, Arc<DatabaseManager>>,
    query: String
) -> Result<Vec<Expediente>, String> {
    let pool = db.sqlite();
    ExpedienteRepository::search(pool, &query)
        .await
        .map_err(|e| e.to_string())
}
