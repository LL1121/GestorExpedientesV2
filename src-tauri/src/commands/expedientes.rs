// Tauri Commands para Expedientes
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;
use serde::{Deserialize, Serialize};

use crate::db::DatabasePool;
use crate::models::expediente::{Expediente, CreateExpediente, UpdateExpediente};
use crate::repositories::ExpedienteRepository;
use crate::utils::infogov_parser::InfoGovExpediente;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcesarExpedienteResult {
    pub success: bool,
    pub id: Option<String>,
    pub resumen: String,
    pub mensaje: String,
    pub nro_infogov: Option<String>,
}


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
/// Procesar y guardar un expediente desde el portapapeles (atajo Alt+I)
/// Parsea el texto capturado, extrae datos de InfoGov y realiza un UPSERT en la base de datos
#[tauri::command]
pub async fn procesar_y_guardar_expediente(
    pools: State<'_, DatabasePool>,
    raw_text: String,
) -> Result<ProcesarExpedienteResult, String> {
    // Parsear el texto del portapapeles
    let infogov_exp = InfoGovExpediente::from_clipboard(&raw_text)?;

    println!("📋 Expediente parseado desde InfoGov:");
    println!("   nro_infogov: {}", infogov_exp.nro_infogov);
    println!("   tema: {}", infogov_exp.tema);
    println!("   nro_gde: {}", infogov_exp.nro_gde);
    println!("   fecha_pase: {}", infogov_exp.fecha_pase);
    println!("   estado: {}", infogov_exp.estado);
    println!("   resumen: {}", infogov_exp.resumen);

    // Intentar hacer UPSERT
    let result = ExpedienteRepository::upsert_from_infogov(
        pools.get_sqlite(),
        infogov_exp.clone(),
    )
    .await
    .map_err(|e| {
        eprintln!("Error al procesar expediente: {}", e);
        format!("Error al procesar expediente: {}", e)
    })?;

    Ok(ProcesarExpedienteResult {
        success: true,
        id: Some(result.id.clone()),
        resumen: infogov_exp.resumen.clone(),
        mensaje: format!(
            "✅ Expediente {} procesado correctamente",
            infogov_exp.nro_infogov
        ),
        nro_infogov: Some(infogov_exp.nro_infogov),
    })
}