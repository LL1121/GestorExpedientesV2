use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Modelo de Expediente
/// Representa un expediente administrativo (InfoGov, GDE, etc.)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Expediente {
    /// ID único (UUID v4)
    pub id: Uuid,
    
    /// Identificación del expediente
    pub numero: String,
    pub año: i32,
    pub tipo: TipoExpediente,
    
    /// Descripción y contenido
    pub asunto: String,
    pub descripcion: Option<String>,
    
    /// Categorización
    pub area_responsable: String,
    pub prioridad: Prioridad,
    pub estado: EstadoExpediente,
    
    /// Fechas importantes
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_vencimiento: Option<DateTime<Utc>>,
    pub fecha_finalizacion: Option<DateTime<Utc>>,
    
    /// Vinculaciones
    pub agente_responsable_id: Option<Uuid>,
    
    /// Archivos adjuntos (rutas relativas)
    pub archivos_adjuntos: Option<String>, // JSON array de rutas
    
    /// Observaciones
    pub observaciones: Option<String>,
    
    /// Metadatos
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
}

/// Tipo de expediente según el sistema
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "tipo_expediente", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TipoExpediente {
    InfoGov,
    Gde,
    Interno,
    Otro,
}

/// Estado del expediente en su ciclo de vida
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "estado_expediente", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EstadoExpediente {
    Iniciado,
    EnProceso,
    EnRevision,
    Observado,
    Finalizado,
    Archivado,
}

/// Nivel de prioridad
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "prioridad", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Prioridad {
    Baja,
    Media,
    Alta,
    Urgente,
}

/// Datos para crear un expediente
#[derive(Debug, Deserialize)]
pub struct CreateExpediente {
    pub numero: String,
    pub año: i32,
    pub tipo: TipoExpediente,
    pub asunto: String,
    pub descripcion: Option<String>,
    pub area_responsable: String,
    pub prioridad: Prioridad,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_vencimiento: Option<DateTime<Utc>>,
    pub agente_responsable_id: Option<Uuid>,
}

/// Datos para actualizar un expediente
#[derive(Debug, Deserialize)]
pub struct UpdateExpediente {
    pub asunto: Option<String>,
    pub descripcion: Option<String>,
    pub prioridad: Option<Prioridad>,
    pub estado: Option<EstadoExpediente>,
    pub fecha_vencimiento: Option<DateTime<Utc>>,
    pub fecha_finalizacion: Option<DateTime<Utc>>,
    pub agente_responsable_id: Option<Uuid>,
    pub observaciones: Option<String>,
}
