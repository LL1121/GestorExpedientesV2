use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Modelo de Vehículo
/// Representa un vehículo de la flota institucional
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Vehiculo {
    /// ID único (UUID v4)
    pub id: Uuid,
    
    /// Identificación del vehículo
    pub patente: String,
    pub marca: String,
    pub modelo: String,
    pub año: i32,
    pub tipo: TipoVehiculo,
    
    /// Especificaciones técnicas
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub color: Option<String>,
    
    /// Estado y condición
    pub activo: bool,
    pub kilometraje_actual: f64,
    
    /// Capacidad de combustible
    pub capacidad_tanque: f64, // en litros
    
    /// Documentación
    pub vencimiento_seguro: Option<DateTime<Utc>>,
    pub vencimiento_vtv: Option<DateTime<Utc>>,
    pub vencimiento_habilitacion: Option<DateTime<Utc>>,
    
    /// Asignación
    pub area_asignada: Option<String>,
    pub agente_asignado_id: Option<Uuid>,
    
    /// Observaciones
    pub observaciones: Option<String>,
    
    /// Metadatos
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
}

/// Tipo de vehículo
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "tipo_vehiculo", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TipoVehiculo {
    Auto,
    Camioneta,
    Camion,
    Utilitario,
    Maquinaria,
    Otro,
}

/// Datos para crear un vehículo
#[derive(Debug, Deserialize)]
pub struct CreateVehiculo {
    pub patente: String,
    pub marca: String,
    pub modelo: String,
    pub año: i32,
    pub tipo: TipoVehiculo,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub color: Option<String>,
    pub capacidad_tanque: f64,
    pub kilometraje_actual: f64,
    pub area_asignada: Option<String>,
}

/// Datos para actualizar un vehículo
#[derive(Debug, Deserialize)]
pub struct UpdateVehiculo {
    pub activo: Option<bool>,
    pub kilometraje_actual: Option<f64>,
    pub vencimiento_seguro: Option<DateTime<Utc>>,
    pub vencimiento_vtv: Option<DateTime<Utc>>,
    pub vencimiento_habilitacion: Option<DateTime<Utc>>,
    pub area_asignada: Option<String>,
    pub agente_asignado_id: Option<Uuid>,
    pub observaciones: Option<String>,
}
