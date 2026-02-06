// Tauri Commands para Vehículos
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;
use uuid::Uuid;
use std::sync::Arc;
use chrono::Utc;

use crate::db::DatabaseManager;
use crate::models::vehiculo::{Vehiculo, CreateVehiculo};

/// Obtener todos los vehículos
#[tauri::command]
pub async fn get_all_vehiculos(db: State<'_, Arc<DatabaseManager>>) -> Result<Vec<Vehiculo>, String> {
    let pool = db.sqlite();
    
    let vehiculos = sqlx::query_as::<_, Vehiculo>(
        r#"
        SELECT * FROM vehiculos 
        WHERE activo = true
        ORDER BY patente ASC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error al obtener vehículos: {}", e))?;
    
    Ok(vehiculos)
}

/// Obtener un vehículo por ID
#[tauri::command]
pub async fn get_vehiculo(db: State<'_, Arc<DatabaseManager>>, id: String) -> Result<Vehiculo, String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    let vehiculo = sqlx::query_as::<_, Vehiculo>(
        "SELECT * FROM vehiculos WHERE id = ?"
    )
    .bind(uuid)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error al obtener vehículo: {}", e))?;
    
    Ok(vehiculo)
}

/// Crear un nuevo vehículo
#[tauri::command]
pub async fn create_vehiculo(
    db: State<'_, Arc<DatabaseManager>>,
    data: CreateVehiculo
) -> Result<Vehiculo, String> {
    let pool = db.sqlite();
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    sqlx::query(
        r#"
        INSERT INTO vehiculos (
            id, patente, marca, modelo, año, tipo,
            numero_motor, numero_chasis, color,
            activo, kilometraje_actual, capacidad_tanque,
            area_asignada, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(id)
    .bind(&data.patente)
    .bind(&data.marca)
    .bind(&data.modelo)
    .bind(data.año)
    .bind(&data.tipo)
    .bind(&data.numero_motor)
    .bind(&data.numero_chasis)
    .bind(&data.color)
    .bind(true)
    .bind(data.kilometraje_actual)
    .bind(data.capacidad_tanque)
    .bind(&data.area_asignada)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al crear vehículo: {}", e))?;
    
    // Obtener el vehículo creado
    get_vehiculo(db, id.to_string()).await
}

/// Actualizar el kilometraje de un vehículo
#[tauri::command]
pub async fn update_kilometraje(
    db: State<'_, Arc<DatabaseManager>>,
    id: String,
    kilometraje: f64
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    sqlx::query(
        r#"
        UPDATE vehiculos 
        SET kilometraje_actual = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(kilometraje)
    .bind(Utc::now())
    .bind(uuid)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al actualizar kilometraje: {}", e))?;
    
    Ok(())
}

/// Eliminar un vehículo (soft delete)
#[tauri::command]
pub async fn delete_vehiculo(
    db: State<'_, Arc<DatabaseManager>>,
    id: String
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id)
        .map_err(|_| "ID inválido".to_string())?;
    
    let pool = db.sqlite();
    
    sqlx::query(
        r#"
        UPDATE vehiculos 
        SET activo = false, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(Utc::now())
    .bind(uuid)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al eliminar vehículo: {}", e))?;
    
    Ok(())
}
