// Módulos principales
pub mod db;
pub mod error;
pub mod models;
pub mod repositories;
pub mod commands;

// Re-exports
pub use db::{DatabasePool, init_databases};
pub use error::{AppError, AppResult};

use std::env;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_db_status(pools: tauri::State<'_, DatabasePool>) -> Result<String, String> {
    let has_postgres = pools.has_postgres();
    
    Ok(format!(
        "SQLite: ✅ Conectado | PostgreSQL: {}",
        if has_postgres { "✅ Conectado" } else { "⚠️ Desconectado (modo offline)" }
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
            // Obtener rutas de bases de datos del entorno
            let sqlite_path = env::var("SQLITE_PATH").unwrap_or_else(|_| "app.db".to_string());
            let postgres_url = env::var("DATABASE_URL").ok();

            // Inicializar pools de bases de datos
            let pools = DatabasePool::new(&sqlite_path, postgres_url.as_deref())
                .await
                .expect("Error al inicializar pools de bases de datos");

            // Ejecutar migraciones
            init_databases(&pools)
                .await
                .expect("Error al ejecutar migraciones");

            println!("🚀 Base de datos inicializada correctamente");
            println!("📍 SQLite: {}", sqlite_path);
            if let Some(url) = &postgres_url {
                println!("📍 PostgreSQL: {}", url);
            }

            // Iniciar Tauri
            tauri::Builder::default()
                .plugin(tauri_plugin_opener::init())
                .manage(pools)
                .invoke_handler(tauri::generate_handler![
                    greet,
                    get_db_status,
                    // Commands de Expedientes
                    commands::obtener_expedientes,
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
