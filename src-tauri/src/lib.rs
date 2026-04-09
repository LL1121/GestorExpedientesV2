// Módulos principales
pub mod db;
pub mod error;
pub mod models;
pub mod repositories;
pub mod commands;
pub mod services;
pub mod utils;

// Re-exports
pub use db::{DatabasePool, init_databases};
pub use error::AppError;

use std::env;
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use tauri::Emitter;
use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};

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
            let sqlite_path = env::var("SQLITE_PATH").unwrap_or_else(|_| "../app.db".to_string());
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
                .plugin(tauri_plugin_global_shortcut::Builder::new().build())
                .plugin(tauri_plugin_clipboard_manager::init())
                .plugin(tauri_plugin_notification::init())
                .on_window_event(|window, event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                })
                .manage(pools.clone())
                .invoke_handler(tauri::generate_handler![
                    greet,
                    get_db_status,
                    // Commands de Expedientes
                    commands::get_expedientes,
                    commands::obtener_expedientes,
                    commands::get_expediente,
                    commands::create_expediente,
                    commands::update_expediente,
                    commands::delete_expediente,
                    commands::search_expedientes,
                    commands::procesar_y_guardar_expediente,
                    commands::get_expedientes_notificaciones,
                    commands::populate_mock_data,
                    commands::clasificar_gasto_expediente,
                    commands::get_gastos_by_vehiculo,
                    commands::get_gastos_by_categoria,
                    // Commands de Órdenes de Compra
                    commands::obtener_proveedores,
                    commands::crear_proveedor,
                    commands::obtener_config_topes,
                    commands::actualizar_config_tope,
                    commands::preparar_nueva_oc,
                    commands::crear_orden_compra,
                    commands::obtener_ordenes_compra,
                    commands::generar_pdf,
                    commands::generar_excel,
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
                    commands::seleccionar_directorio_guardado,
                ])
                .setup(move |app| {
                    let app_handle = app.handle();
                    let pools_clone = pools.clone();

                    // Crear icono de bandeja del sistema (tray)
                    let show_item = MenuItemBuilder::with_id("show", "Abrir").build(app)?;
                    let quit_item = MenuItemBuilder::with_id("quit", "Cerrar").build(app)?;
                    let tray_menu = MenuBuilder::new(app)
                        .items(&[&show_item, &quit_item])
                        .build()?;

                    let tray_icon = TrayIconBuilder::with_id("main-tray")
                        .icon(
                            app.default_window_icon()
                                .expect("No se encontró icono por defecto para la app")
                                .clone(),
                        )
                        .tooltip("Gestor de Irrigación")
                        .menu(&tray_menu)
                        .on_menu_event(|app: &tauri::AppHandle, event| match event.id.as_ref() {
                            "show" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                            "quit" => {
                                app.exit(0);
                            }
                            _ => {}
                        })
                        .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
                            if let TrayIconEvent::Click {
                                button: MouseButton::Left,
                                button_state: MouseButtonState::Up,
                                ..
                            } = event
                            {
                                if let Some(window) = tray.app_handle().get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        })
                        .build(app)?;

                    // Mantener referencia viva del tray durante toda la ejecución
                    app.manage(tray_icon);

                    // Registrar el atajo Alt+I en el setup
                    let shortcut_manager = app.global_shortcut();
                    
                    // Registrar el atajo Alt+I
                    if let Err(e) = shortcut_manager.register("alt+i") {
                        eprintln!("⚠️ Error registrando atajo Alt+I (continuando sin atajo): {}", e);
                    } else {
                        println!("✅ Atajo Alt+I registrado correctamente");

                        // Escuchar evento del atajo
                        let app = app_handle.clone();
                        let pools = pools_clone.clone();
                        let _ = shortcut_manager.on_shortcut("alt+i", move |_app, shortcut, _event| {
                            let app = app.clone();
                            let pools = pools.clone();
                            
                            println!("⌨️ Atajo presionado: {}", shortcut);
                            
                            tauri::async_runtime::spawn(async move {
                                procesar_atajo_infogov(&app, &pools).await;
                            });
                        });
                    }

                    Ok(())
                })
                .run(tauri::generate_context!())
                .expect("error while running tauri application");
        });
}

/// Procesa el atajo Alt+I: captura portapapeles y guarda expediente
async fn procesar_atajo_infogov(app: &tauri::AppHandle, pools: &crate::db::DatabasePool) {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    use crate::repositories::ExpedienteRepository;
    use crate::utils::infogov_parser::InfoGovExpediente;

    println!("🔥 Atajo Alt+I activado");

    // Leer portapapeles
    match app.clipboard().read_text() {
        Ok(text) => {
            println!("📋 Texto del portapapeles: {} caracteres", text.len());
            
            // Procesar expediente desde InfoGov
            match InfoGovExpediente::from_clipboard(&text) {
                Ok(infogov_exp) => {
                    // Guardar en base de datos
                    match ExpedienteRepository::upsert_from_infogov(
                        pools.get_sqlite(),
                        infogov_exp.clone(),
                    ).await {
                        Ok(result) => {
                            println!("✅ Expediente procesado: {}", infogov_exp.nro_infogov);
                            
                            // Emitir evento al frontend
                            let _ = app.emit("expediente_procesado", serde_json::json!({
                                "success": true,
                                "id": result.id,
                                "resumen": infogov_exp.resumen,
                                "nro_infogov": infogov_exp.nro_infogov,
                                "mensaje": format!("✅ Expediente {} procesado correctamente", infogov_exp.nro_infogov)
                            }));
                        }
                        Err(e) => {
                            eprintln!("❌ Error al guardar: {}", e);
                            let _ = app.emit("expediente_error", serde_json::json!({
                                "error": format!("Error al guardar: {}", e),
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));
                        }
                    }
                }
                Err(e) => {
                    eprintln!("❌ Error al parsear: {}", e);
                    let _ = app.emit("expediente_error", serde_json::json!({
                        "error": e,
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    }));
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Error al leer portapapeles: {}", e);
            let _ = app.emit("expediente_error", serde_json::json!({
                "error": format!("Error al leer portapapeles: {}", e),
                "timestamp": chrono::Utc::now().to_rfc3339()
            }));
        }
    }
}
