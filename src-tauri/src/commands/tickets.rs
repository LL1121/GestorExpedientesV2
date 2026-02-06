// Tauri Commands para Tickets de Combustible
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;
use uuid::Uuid;
use std::sync::Arc;
use chrono::Utc;

use crate::db::DatabaseManager;
use crate::models::ticket::{Ticket, CreateTicket, RendimientoVehiculo};

/// Obtener todos los tickets de combustible
#[tauri::command]
pub async fn get_all_tickets(db: State<'_, Arc<DatabaseManager>>) -> Result<Vec<Ticket>, String> {
    let pool = db.sqlite();
    
    let tickets = sqlx::query_as::<_, Ticket>(
        r#"
        SELECT * FROM tickets_combustible 
        ORDER BY fecha_carga DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error al obtener tickets: {}", e))?;
    
    Ok(tickets)
}

/// Obtener tickets por vehículo
#[tauri::command]
pub async fn get_tickets_by_vehiculo(
    db: State<'_, Arc<DatabaseManager>>,
    vehiculo_id: String
) -> Result<Vec<Ticket>, String> {
    let uuid = Uuid::parse_str(&vehiculo_id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    let tickets = sqlx::query_as::<_, Ticket>(
        r#"
        SELECT * FROM tickets_combustible 
        WHERE vehiculo_id = ?
        ORDER BY fecha_carga DESC
        "#
    )
    .bind(uuid)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error al obtener tickets: {}", e))?;
    
    Ok(tickets)
}

/// Crear un ticket de combustible
#[tauri::command]
pub async fn create_ticket(
    db: State<'_, Arc<DatabaseManager>>,
    data: CreateTicket
) -> Result<Ticket, String> {
    let pool = db.sqlite();
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    // Calcular monto total
    let monto_total = data.litros * data.precio_por_litro;
    
    // Obtener kilometraje anterior del último ticket
    let kilometraje_anterior: Option<f64> = sqlx::query_scalar(
        r#"
        SELECT kilometraje 
        FROM tickets_combustible 
        WHERE vehiculo_id = ?
        ORDER BY fecha_carga DESC
        LIMIT 1
        "#
    )
    .bind(data.vehiculo_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Error al obtener kilometraje anterior: {}", e))?;
    
    sqlx::query(
        r#"
        INSERT INTO tickets_combustible (
            id, vehiculo_id, agente_id, fecha_carga, numero_ticket,
            tipo_combustible, litros, precio_por_litro, monto_total,
            kilometraje, kilometraje_anterior, estacion_servicio,
            localidad, observaciones, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(id)
    .bind(data.vehiculo_id)
    .bind(data.agente_id)
    .bind(data.fecha_carga)
    .bind(&data.numero_ticket)
    .bind(&data.tipo_combustible)
    .bind(data.litros)
    .bind(data.precio_por_litro)
    .bind(monto_total)
    .bind(data.kilometraje)
    .bind(kilometraje_anterior)
    .bind(&data.estacion_servicio)
    .bind(&data.localidad)
    .bind(&data.observaciones)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al crear ticket: {}", e))?;
    
    // Actualizar kilometraje del vehículo
    sqlx::query(
        "UPDATE vehiculos SET kilometraje_actual = ?, updated_at = ? WHERE id = ?"
    )
    .bind(data.kilometraje)
    .bind(now)
    .bind(data.vehiculo_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al actualizar kilometraje: {}", e))?;
    
    // Obtener el ticket creado
    let ticket = sqlx::query_as::<_, Ticket>(
        "SELECT * FROM tickets_combustible WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error al obtener ticket creado: {}", e))?;
    
    Ok(ticket)
}

/// Calcular rendimiento de un vehículo
#[tauri::command]
pub async fn calcular_rendimiento(
    db: State<'_, Arc<DatabaseManager>>,
    vehiculo_id: String
) -> Result<RendimientoVehiculo, String> {
    let uuid = Uuid::parse_str(&vehiculo_id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    // Obtener patente del vehículo
    let patente: String = sqlx::query_scalar(
        "SELECT patente FROM vehiculos WHERE id = ?"
    )
    .bind(uuid)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error al obtener vehículo: {}", e))?;
    
    // Calcular estadísticas
    let stats: (f64, f64, i64) = sqlx::query_as(
        r#"
        SELECT 
            COALESCE(SUM(litros), 0) as total_litros,
            COALESCE(SUM(monto_total), 0) as total_gastado,
            COUNT(*) as cantidad_cargas
        FROM tickets_combustible
        WHERE vehiculo_id = ?
        "#
    )
    .bind(uuid)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error al calcular estadísticas: {}", e))?;
    
    // Obtener kilometros recorridos
    let (km_inicial, km_final): (Option<f64>, Option<f64>) = sqlx::query_as(
        r#"
        SELECT 
            (SELECT kilometraje FROM tickets_combustible WHERE vehiculo_id = ? ORDER BY fecha_carga ASC LIMIT 1) as km_inicial,
            (SELECT kilometraje FROM tickets_combustible WHERE vehiculo_id = ? ORDER BY fecha_carga DESC LIMIT 1) as km_final
        "#
    )
    .bind(uuid)
    .bind(uuid)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error al calcular kilometros: {}", e))?;
    
    let km_recorridos = match (km_inicial, km_final) {
        (Some(inicial), Some(final_km)) => final_km - inicial,
        _ => 0.0,
    };
    
    let rendimiento_promedio = if stats.0 > 0.0 {
        km_recorridos / stats.0
    } else {
        0.0
    };
    
    let costo_por_km = if km_recorridos > 0.0 {
        stats.1 / km_recorridos
    } else {
        0.0
    };
    
    Ok(RendimientoVehiculo {
        vehiculo_id: uuid,
        patente,
        total_litros: stats.0,
        total_gastado: stats.1,
        kilometros_recorridos: km_recorridos,
        rendimiento_promedio,
        costo_por_km,
        cantidad_cargas: stats.2 as i32,
    })
}

/// Eliminar un ticket
#[tauri::command]
pub async fn delete_ticket(
    db: State<'_, Arc<DatabaseManager>>,
    id: String
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    sqlx::query("DELETE FROM tickets_combustible WHERE id = ?")
        .bind(uuid)
        .execute(pool)
        .await
        .map_err(|e| format!("Error al eliminar ticket: {}", e))?;
    
    Ok(())
}
