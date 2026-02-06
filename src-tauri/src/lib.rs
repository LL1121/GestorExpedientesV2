// Módulos principales
mod db;
mod error;
mod models;
mod repositories;
mod commands;

// Re-exports
pub use db::{DatabaseManager, DatabaseConfig, config_from_env};
pub use error::{AppError, AppResult};

use once_cell::sync::OnceCell;
use std::sync::Arc;

// Instancia global del DatabaseManager (singleton)
static DB_MANAGER: OnceCell<Arc<DatabaseManager>> = OnceCell::new();

/// Obtiene la instancia global del DatabaseManager
pub fn get_db() -> &'static Arc<DatabaseManager> {
    DB_MANAGER.get().expect("DatabaseManager no inicializado")
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_db_status() -> Result<String, String> {
    let db = get_db();
    let postgres_connected = db.is_postgres_connected().await;
    
    Ok(format!(
        "SQLite: ✅ Conectado | PostgreSQL: {}",
        if postgres_connected { "✅ Conectado" } else { "⚠️ Desconectado (modo offline)" }
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Configuración de Tokio runtime para async
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            // Inicializar el DatabaseManager
            let config = config_from_env();
            let db_manager = DatabaseManager::new(config)
                .await
                .expect("Error al inicializar DatabaseManager");
            
            DB_MANAGER.set(Arc::new(db_manager))
                .expect("Error al configurar DatabaseManager global");

            println!("🚀 DatabaseManager inicializado correctamente");

            // Obtener referencia al DatabaseManager para pasarlo como estado
            let db_manager = DB_MANAGER.get()
                .expect("DatabaseManager no inicializado")
                .clone();

            // Iniciar Tauri
            tauri::Builder::default()
                .plugin(tauri_plugin_opener::init())
                .manage(db_manager)
                .invoke_handler(tauri::generate_handler![
                    greet,
                    get_db_status,
                    // Commands de Expedientes
                    commands::get_expedientes,
                    commands::get_expediente,
                    commands::create_expediente,
                    commands::update_expediente,
                    commands::delete_expediente,
                    commands::search_expedientes,
                    // Commands de Vehículos
                    commands::get_all_vehiculos,
                    commands::get_vehiculo,
                    commands::create_vehiculo,
                    commands::update_kilometraje,
                    commands::delete_vehiculo,
                    // Commands de Tickets/Combustible
                    commands::get_all_tickets,
                    commands::get_tickets_by_vehiculo,
                    commands::create_ticket,
                    commands::calcular_rendimiento,
                    commands::delete_ticket,
                    // Commands de Agentes/Personal
                    commands::get_all_agentes,
                    commands::get_agente,
                    commands::create_agente,
                    commands::update_agente,
                    commands::delete_agente,
                    commands::get_estadisticas_licencias,
                    // Commands de Exportación Excel
                    commands::exportar_excel_pendientes,
                    commands::exportar_excel_todos,
                    commands::exportar_excel_movilidades,
                    commands::exportar_excel_personal,
                ])
                .run(tauri::generate_context!())
                .expect("error while running tauri application");
        });
}
