use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Modelo de Agente/Personal
/// Representa a un empleado de la Jefatura de Zona de Riego
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Agente {
    /// ID único (UUID v4) - permite sincronización sin conflictos
    pub id: Uuid,
    
    /// Datos personales
    pub dni: String,
    pub nombre: String,
    pub apellido: String,
    pub email: Option<String>,
    pub telefono: Option<String>,
    
    /// Datos laborales
    pub legajo: String,
    pub cargo: String,
    pub area: String,
    pub fecha_ingreso: DateTime<Utc>,
    
    /// Estado del agente
    pub activo: bool,
    
    /// Licencias y permisos
    pub licencia_conducir: Option<String>,
    pub vencimiento_licencia: Option<DateTime<Utc>>,
    
    /// Metadatos de sincronización
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
}

/// Datos para crear un nuevo agente
#[derive(Debug, Deserialize)]
pub struct CreateAgente {
    pub dni: String,
    pub nombre: String,
    pub apellido: String,
    pub email: Option<String>,
    pub telefono: Option<String>,
    pub legajo: String,
    pub cargo: String,
    pub area: String,
    pub fecha_ingreso: DateTime<Utc>,
    pub licencia_conducir: Option<String>,
    pub vencimiento_licencia: Option<DateTime<Utc>>,
}

/// Datos para actualizar un agente existente
#[derive(Debug, Deserialize)]
pub struct UpdateAgente {
    pub nombre: Option<String>,
    pub apellido: Option<String>,
    pub email: Option<String>,
    pub telefono: Option<String>,
    pub cargo: Option<String>,
    pub area: Option<String>,
    pub activo: Option<bool>,
    pub licencia_conducir: Option<String>,
    pub vencimiento_licencia: Option<DateTime<Utc>>,
}

impl Agente {
    /// Calcula el estado del semáforo de licencias
    /// 🟢 Verde: > 30 días para vencer
    /// 🟡 Amarillo: 7-30 días para vencer
    /// 🔴 Rojo: < 7 días o vencida
    pub fn licencia_status(&self) -> LicenciaStatus {
        match self.vencimiento_licencia {
            None => LicenciaStatus::SinLicencia,
            Some(vencimiento) => {
                let dias_restantes = (vencimiento - Utc::now()).num_days();
                if dias_restantes < 0 {
                    LicenciaStatus::Vencida
                } else if dias_restantes < 7 {
                    LicenciaStatus::PorVencer
                } else if dias_restantes < 30 {
                    LicenciaStatus::ProximoVencimiento
                } else {
                    LicenciaStatus::Vigente
                }
            }
        }
    }
}

#[derive(Debug, Serialize)]
pub enum LicenciaStatus {
    Vigente,
    ProximoVencimiento,
    PorVencer,
    Vencida,
    SinLicencia,
}
