// Tauri Commands para Expedientes
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;

use crate::db::DatabasePool;
use crate::models::expediente::{Expediente, CreateExpediente, UpdateExpediente};
use crate::repositories::ExpedienteRepository;

/// Obtener todos los expedientes
#[tauri::command]
pub async fn get_expedientes(pools: State<'_, DatabasePool>) -> Result<Vec<Expediente>, String> {
    ExpedienteRepository::get_all(pools.get_sqlite())
        .await
        .map_err(|e| e.to_string())
}

/// Alias para compatibilidad
#[tauri::command]
pub async fn obtener_expedientes(pools: State<'_, DatabasePool>) -> Result<Vec<Expediente>, String> {
    get_expedientes(pools).await
}

/// Obtener un expediente por ID
#[tauri::command]
pub async fn get_expediente(pools: State<'_, DatabasePool>, id: String) -> Result<Expediente, String> {
    ExpedienteRepository::get_by_id(pools.get_sqlite(), &id)
        .await
        .map_err(|e| e.to_string())
}

/// Crear un nuevo expediente
#[tauri::command]
pub async fn create_expediente(
    pools: State<'_, DatabasePool>,
    data: CreateExpediente,
) -> Result<Expediente, String> {
    ExpedienteRepository::create(pools.get_sqlite(), data)
        .await
        .map_err(|e| e.to_string())
}

/// Actualizar un expediente existente
#[tauri::command]
pub async fn update_expediente(
    pools: State<'_, DatabasePool>,
    id: String,
    data: UpdateExpediente,
) -> Result<Expediente, String> {
    ExpedienteRepository::update(pools.get_sqlite(), &id, data)
        .await
        .map_err(|e| e.to_string())
}

/// Eliminar un expediente
#[tauri::command]
pub async fn delete_expediente(pools: State<'_, DatabasePool>, id: String) -> Result<(), String> {
    ExpedienteRepository::delete(pools.get_sqlite(), &id)
        .await
        .map_err(|e| e.to_string())
}

/// Buscar expedientes por texto
#[tauri::command]
pub async fn search_expedientes(pools: State<'_, DatabasePool>, query: String) -> Result<Vec<Expediente>, String> {
    ExpedienteRepository::search(pools.get_sqlite(), &query)
        .await
        .map_err(|e| e.to_string())
}
