// Tauri Commands para Agentes/Personal
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;
use uuid::Uuid;
use std::sync::Arc;
use chrono::Utc;
use serde::Serialize;

use crate::db::DatabaseManager;
use crate::models::agente::{Agente, CreateAgente, UpdateAgente};

/// Estructura extendida del agente con cálculo de semáforo
#[derive(Debug, Serialize)]
pub struct AgenteConSemaforo {
    #[serde(flatten)]
    pub agente: Agente,
    pub dias_restantes: Option<i32>,
    pub semaforo_status: Option<String>,
}

/// Obtener todos los agentes
#[tauri::command]
pub async fn get_all_agentes(db: State<'_, Arc<DatabaseManager>>) -> Result<Vec<AgenteConSemaforo>, String> {
    let pool = db.sqlite();
    
    let agentes = sqlx::query_as::<_, Agente>(
        r#"
        SELECT * FROM agentes 
        WHERE activo = true
        ORDER BY apellido, nombre ASC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error al obtener agentes: {}", e))?;
    
    // Calcular semáforo para cada agente
    let agentes_con_semaforo: Vec<AgenteConSemaforo> = agentes
        .into_iter()
        .map(|agente| {
            let (dias_restantes, semaforo_status) = calcular_semaforo(&agente);
            AgenteConSemaforo {
                agente,
                dias_restantes,
                semaforo_status,
            }
        })
        .collect();
    
    Ok(agentes_con_semaforo)
}

/// Obtener un agente por ID
#[tauri::command]
pub async fn get_agente(db: State<'_, Arc<DatabaseManager>>, id: String) -> Result<Agente, String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    let agente = sqlx::query_as::<_, Agente>(
        "SELECT * FROM agentes WHERE id = ?"
    )
    .bind(uuid)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error al obtener agente: {}", e))?;
    
    Ok(agente)
}

/// Crear un nuevo agente
#[tauri::command]
pub async fn create_agente(
    db: State<'_, Arc<DatabaseManager>>,
    data: CreateAgente
) -> Result<Agente, String> {
    let pool = db.sqlite();
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    sqlx::query(
        r#"
        INSERT INTO agentes (
            id, dni, nombre, apellido, email, telefono,
            legajo, cargo, area, fecha_ingreso, activo,
            licencia_conducir, vencimiento_licencia,
            created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(id)
    .bind(&data.dni)
    .bind(&data.nombre)
    .bind(&data.apellido)
    .bind(&data.email)
    .bind(&data.telefono)
    .bind(&data.legajo)
    .bind(&data.cargo)
    .bind(&data.area)
    .bind(data.fecha_ingreso)
    .bind(true)
    .bind(&data.licencia_conducir)
    .bind(data.vencimiento_licencia)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al crear agente: {}", e))?;
    
    // Obtener el agente creado
    get_agente(db, id.to_string()).await
}

/// Actualizar un agente existente
#[tauri::command]
pub async fn update_agente(
    db: State<'_, Arc<DatabaseManager>>,
    id: String,
    data: UpdateAgente
) -> Result<Agente, String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    // Construir query dinámica solo con campos presentes
    let mut query_parts = vec!["UPDATE agentes SET updated_at = ?"];
    let mut bind_count = 1;
    
    if data.nombre.is_some() { query_parts.push("nombre = ?"); bind_count += 1; }
    if data.apellido.is_some() { query_parts.push("apellido = ?"); bind_count += 1; }
    if data.email.is_some() { query_parts.push("email = ?"); bind_count += 1; }
    if data.telefono.is_some() { query_parts.push("telefono = ?"); bind_count += 1; }
    if data.cargo.is_some() { query_parts.push("cargo = ?"); bind_count += 1; }
    if data.area.is_some() { query_parts.push("area = ?"); bind_count += 1; }
    if data.activo.is_some() { query_parts.push("activo = ?"); bind_count += 1; }
    if data.licencia_conducir.is_some() { query_parts.push("licencia_conducir = ?"); bind_count += 1; }
    if data.vencimiento_licencia.is_some() { query_parts.push("vencimiento_licencia = ?"); bind_count += 1; }
    
    query_parts.push("WHERE id = ?");
    
    let query_str = query_parts.join(", ").replace(", WHERE", " WHERE");
    let mut query = sqlx::query(&query_str);
    
    query = query.bind(Utc::now());
    if let Some(v) = data.nombre { query = query.bind(v); }
    if let Some(v) = data.apellido { query = query.bind(v); }
    if let Some(v) = data.email { query = query.bind(v); }
    if let Some(v) = data.telefono { query = query.bind(v); }
    if let Some(v) = data.cargo { query = query.bind(v); }
    if let Some(v) = data.area { query = query.bind(v); }
    if let Some(v) = data.activo { query = query.bind(v); }
    if let Some(v) = data.licencia_conducir { query = query.bind(v); }
    if let Some(v) = data.vencimiento_licencia { query = query.bind(v); }
    query = query.bind(uuid);
    
    query.execute(pool)
        .await
        .map_err(|e| format!("Error al actualizar agente: {}", e))?;
    
    get_agente(db, id).await
}

/// Eliminar un agente (soft delete)
#[tauri::command]
pub async fn delete_agente(
    db: State<'_, Arc<DatabaseManager>>,
    id: String
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    sqlx::query(
        r#"
        UPDATE agentes 
        SET activo = false, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(Utc::now())
    .bind(uuid)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al eliminar agente: {}", e))?;
    
    Ok(())
}

/// Calcular semáforo de licencias según días restantes
/// 🔴 Rojo: < 15 días
/// 🟠 Naranja: 15-45 días
/// 🟢 Verde: > 45 días
fn calcular_semaforo(agente: &Agente) -> (Option<i32>, Option<String>) {
    match agente.vencimiento_licencia {
        None => (None, None),
        Some(vencimiento) => {
            let dias_restantes = (vencimiento - Utc::now()).num_days() as i32;
            
            let status = if dias_restantes < 0 {
                "vencida".to_string()
            } else if dias_restantes < 15 {
                "rojo".to_string()
            } else if dias_restantes < 45 {
                "naranja".to_string()
            } else {
                "verde".to_string()
            };
            
            let dias = if dias_restantes > 0 { dias_restantes } else { 0 };
            (Some(dias), Some(status))
        }
    }
}

/// Obtener estadísticas del semáforo de licencias
#[derive(Debug, Serialize)]
pub struct EstadisticasLicencias {
    pub total_agentes: i32,
    pub con_licencia: i32,
    pub sin_licencia: i32,
    pub criticas: i32,      // < 15 días
    pub por_vencer: i32,    // 15-45 días
    pub vigentes: i32,      // > 45 días
    pub vencidas: i32,
}

#[tauri::command]
pub async fn get_estadisticas_licencias(
    db: State<'_, Arc<DatabaseManager>>
) -> Result<EstadisticasLicencias, String> {
    let agentes = get_all_agentes(db).await?;
    
    let total_agentes = agentes.len() as i32;
    let sin_licencia = agentes.iter()
        .filter(|a| a.agente.vencimiento_licencia.is_none())
        .count() as i32;
    let con_licencia = total_agentes - sin_licencia;
    
    let criticas = agentes.iter()
        .filter(|a| a.semaforo_status.as_deref() == Some("rojo"))
        .count() as i32;
    
    let por_vencer = agentes.iter()
        .filter(|a| a.semaforo_status.as_deref() == Some("naranja"))
        .count() as i32;
    
    let vigentes = agentes.iter()
        .filter(|a| a.semaforo_status.as_deref() == Some("verde"))
        .count() as i32;
    
    let vencidas = agentes.iter()
        .filter(|a| a.semaforo_status.as_deref() == Some("vencida"))
        .count() as i32;
    
    Ok(EstadisticasLicencias {
        total_agentes,
        con_licencia,
        sin_licencia,
        criticas,
        por_vencer,
        vigentes,
        vencidas,
    })
}
