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

/// Obtener notificaciones y expedientes pendientes
#[tauri::command]
pub async fn get_expedientes_notificaciones(pools: State<'_, DatabasePool>) -> Result<serde_json::Value, String> {
    // Obtener todos los expedientes
    let expedientes = ExpedienteRepository::get_all(pools.get_sqlite())
        .await
        .map_err(|e| e.to_string())?;

    // Contar expedientes por estado para notificaciones
    let mut stats = serde_json::json!({
        "total": expedientes.len(),
        "por_estado": {},
        "por_tipo": {},
        "vencidos": 0,
        "proximos_vencer": 0,
        "sin_pagar": 0,
        "pendientes": 0,
        "criticos": 0
    });

    let hoy = chrono::Local::now().naive_local().date();

    // Analizar expedientes y contar alertas
    let mut vencidos = Vec::new();
    let mut proximos_vencer = Vec::new();
    let mut sin_pagar = Vec::new();
    let mut pendientes = Vec::new();
    let mut criticos = 0;

    for exp in &expedientes {
        // Contar por estado - convertir enum a string
        let estado_str = format!("{:?}", exp.estado);
        stats["por_estado"]
            .as_object_mut()
            .unwrap()
            .entry(estado_str)
            .or_insert(serde_json::json!(0));
        
        if let Some(val) = stats["por_estado"].get_mut(&format!("{:?}", exp.estado)) {
            if let Some(n) = val.as_i64() {
                *val = serde_json::json!(n + 1);
            }
        }

        // Contar por tipo - convertir enum a string
        let tipo_str = format!("{:?}", exp.tipo);
        stats["por_tipo"]
            .as_object_mut()
            .unwrap()
            .entry(tipo_str)
            .or_insert(serde_json::json!(0));
        
        if let Some(val) = stats["por_tipo"].get_mut(&format!("{:?}", exp.tipo)) {
            if let Some(n) = val.as_i64() {
                *val = serde_json::json!(n + 1);
            }
        }

        // Detectar expedientes vencidos
        if let Some(fecha_venc) = &exp.fecha_vencimiento {
            let fecha_venc_date = fecha_venc.date_naive();
            if fecha_venc_date < hoy {
                vencidos.push(serde_json::json!({
                    "id": exp.id,
                    "numero": exp.numero,
                    "año": exp.año,
                    "asunto": exp.asunto,
                    "estado": format!("{:?}", exp.estado),
                    "fecha_vencimiento": fecha_venc.to_rfc3339(),
                    "dias_vencido": (hoy - fecha_venc_date).num_days()
                }));
                criticos += 1;
                stats["vencidos"] = serde_json::json!(stats["vencidos"].as_i64().unwrap_or(0) + 1);
            } else {
                // Próximo a vencer (7 días)
                let dias_para_vencer = (fecha_venc_date - hoy).num_days();
                if dias_para_vencer <= 7 && dias_para_vencer > 0 {
                    proximos_vencer.push(serde_json::json!({
                        "id": exp.id,
                        "numero": exp.numero,
                        "año": exp.año,
                        "asunto": exp.asunto,
                        "estado": format!("{:?}", exp.estado),
                        "fecha_vencimiento": fecha_venc.to_rfc3339(),
                        "dias_para_vencer": dias_para_vencer
                    }));
                    stats["proximos_vencer"] = serde_json::json!(stats["proximos_vencer"].as_i64().unwrap_or(0) + 1);
                }
            }
        }

        // Detectar expedientes de pago sin pagar
        let tipo_str = format!("{:?}", exp.tipo);
        let estado_str = format!("{:?}", exp.estado);
        if tipo_str.contains("Pago") && !estado_str.contains("Finalizado") {
            sin_pagar.push(serde_json::json!({
                "id": exp.id,
                "numero": exp.numero,
                "año": exp.año,
                "asunto": exp.asunto,
                "estado": estado_str
            }));
            stats["sin_pagar"] = serde_json::json!(stats["sin_pagar"].as_i64().unwrap_or(0) + 1);
        }

        // Detectar expedientes pendientes (más de 14 días)
        let estado_str = format!("{:?}", exp.estado);
        if estado_str.contains("Iniciado") || estado_str.contains("EnProceso") {
            let fecha_inicio_date = exp.fecha_inicio.date_naive();
            let dias_pendiente = (hoy - fecha_inicio_date).num_days();
            if dias_pendiente > 14 {
                pendientes.push(serde_json::json!({
                    "id": exp.id,
                    "numero": exp.numero,
                    "año": exp.año,
                    "asunto": exp.asunto,
                    "estado": estado_str,
                    "fecha_inicio": exp.fecha_inicio.to_rfc3339(),
                    "dias_pendiente": dias_pendiente
                }));
                stats["pendientes"] = serde_json::json!(stats["pendientes"].as_i64().unwrap_or(0) + 1);
            }
        }
    }

    stats["criticos"] = serde_json::json!(criticos);

    Ok(serde_json::json!({
        "stats": stats,
        "alertas": {
            "vencidos": vencidos,
            "proximos_vencer": proximos_vencer,
            "sin_pagar": sin_pagar,
            "pendientes": pendientes
        }
    }))
}
