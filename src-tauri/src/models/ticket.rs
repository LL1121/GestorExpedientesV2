use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Modelo de Ticket de Combustible
/// Representa una carga de combustible para un vehículo
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Ticket {
    /// ID único (UUID v4)
    pub id: Uuid,
    
    /// Relaciones
    pub vehiculo_id: Uuid,
    pub agente_id: Uuid, // Quien cargó el combustible
    
    /// Datos del ticket
    pub fecha_carga: DateTime<Utc>,
    pub numero_ticket: Option<String>,
    
    /// Combustible
    pub tipo_combustible: TipoCombustible,
    pub litros: f64,
    pub precio_por_litro: f64,
    pub monto_total: f64,
    
    /// Kilometraje al momento de la carga
    pub kilometraje: f64,
    pub kilometraje_anterior: Option<f64>,
    
    /// Estación de servicio
    pub estacion_servicio: String,
    pub localidad: String,
    
    /// Observaciones
    pub observaciones: Option<String>,
    
    /// Metadatos
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
}

/// Tipo de combustible
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "tipo_combustible", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TipoCombustible {
    Nafta,
    Diesel,
    Gnc,
}

/// Datos para crear un ticket
#[derive(Debug, Deserialize)]
pub struct CreateTicket {
    pub vehiculo_id: Uuid,
    pub agente_id: Uuid,
    pub fecha_carga: DateTime<Utc>,
    pub numero_ticket: Option<String>,
    pub tipo_combustible: TipoCombustible,
    pub litros: f64,
    pub precio_por_litro: f64,
    pub kilometraje: f64,
    pub estacion_servicio: String,
    pub localidad: String,
    pub observaciones: Option<String>,
}

/// Estadísticas de rendimiento calculadas
#[derive(Debug, Serialize)]
pub struct RendimientoVehiculo {
    pub vehiculo_id: Uuid,
    pub patente: String,
    pub total_litros: f64,
    pub total_gastado: f64,
    pub kilometros_recorridos: f64,
    pub rendimiento_promedio: f64, // km/l
    pub costo_por_km: f64, // $/km
    pub cantidad_cargas: i32,
}

impl Ticket {
    /// Calcula el rendimiento de esta carga específica (km/l)
    pub fn calcular_rendimiento(&self) -> Option<f64> {
        if let Some(km_anterior) = self.kilometraje_anterior {
            let km_recorridos = self.kilometraje - km_anterior;
            if self.litros > 0.0 && km_recorridos > 0.0 {
                return Some(km_recorridos / self.litros);
            }
        }
        None
    }
    
    /// Calcula el costo por kilómetro de esta carga ($/km)
    pub fn costo_por_km(&self) -> Option<f64> {
        if let Some(km_anterior) = self.kilometraje_anterior {
            let km_recorridos = self.kilometraje - km_anterior;
            if km_recorridos > 0.0 {
                return Some(self.monto_total / km_recorridos);
            }
        }
        None
    }
}
