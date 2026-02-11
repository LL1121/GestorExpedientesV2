use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Modelo de Expediente
/// Representa un expediente administrativo (InfoGov, GDE, etc.)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Expediente {
    /// ID único (UUID v4 como string)
    pub id: String,
    
    /// Identificación del expediente
    pub numero: String,
    pub año: i32,
    pub tipo: TipoExpediente,

    /// Identificadores externos
    pub nro_infogov: Option<String>,
    pub nro_gde: Option<String>,
    pub caratula: Option<String>,
    pub resolucion_nro: Option<String>,
    
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
    pub agente_responsable_id: Option<String>,
    
    /// Archivos adjuntos (rutas relativas)
    pub archivos_adjuntos: Option<String>, // JSON array de rutas
    
    /// Observaciones
    pub observaciones: Option<String>,
    
    /// Campos para Órdenes de Compra (solo si es expediente de pago)
    /// Proveedor/Beneficiario
    pub oc_señor: Option<String>,
    pub oc_domicilio: Option<String>,
    pub oc_cuit: Option<String>,
    
    /// Descripción de zona
    pub oc_descripcion_zona: Option<String>,
    
    /// Datos de forma de pago y plazo
    pub oc_forma_pago: Option<String>,
    pub oc_plazo_entrega: Option<String>,
    
    /// Metadatos
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
}

/// Tipo de expediente según el sistema
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "tipo_expediente", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TipoExpediente {
    #[sqlx(rename = "INFOGOV")]
    InfoGov,
    #[sqlx(rename = "GDE")]
    Gde,
    #[sqlx(rename = "INTERNO")]
    Interno,
    #[sqlx(rename = "PAGO")]
    Pago,
    #[sqlx(rename = "OTRO")]
    Otro,
}

/// Estado del expediente en su ciclo de vida
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "estado_expediente", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EstadoExpediente {
    #[sqlx(rename = "INICIADO")]
    Iniciado,
    #[sqlx(rename = "ENPROCESO")]
    EnProceso,
    #[sqlx(rename = "ENREVISION")]
    EnRevision,
    #[sqlx(rename = "OBSERVADO")]
    Observado,
    #[sqlx(rename = "FINALIZADO")]
    Finalizado,
    #[sqlx(rename = "ARCHIVADO")]
    Archivado,
}

/// Nivel de prioridad
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "prioridad", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Prioridad {
    #[sqlx(rename = "BAJA")]
    Baja,
    #[sqlx(rename = "MEDIA")]
    Media,
    #[sqlx(rename = "ALTA")]
    Alta,
    #[sqlx(rename = "URGENTE")]
    Urgente,
}

/// Datos para crear un expediente
#[derive(Debug, Deserialize)]
pub struct CreateExpediente {
    pub numero: String,
    pub año: i32,
    pub tipo: TipoExpediente,
    pub nro_infogov: Option<String>,
    pub nro_gde: Option<String>,
    pub caratula: Option<String>,
    pub resolucion_nro: Option<String>,
    pub asunto: String,
    pub descripcion: Option<String>,
    pub area_responsable: String,
    pub prioridad: Prioridad,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_vencimiento: Option<DateTime<Utc>>,
    pub agente_responsable_id: Option<String>,
    // Campos específicos para expedientes de tipo "Pago"
    pub oc_señor: Option<String>,
    pub oc_domicilio: Option<String>,
    pub oc_cuit: Option<String>,
    pub oc_descripcion_zona: Option<String>,
    pub oc_forma_pago: Option<String>,
    pub oc_plazo_entrega: Option<String>,
}

/// Datos para actualizar un expediente
#[derive(Debug, Deserialize)]
pub struct UpdateExpediente {
    pub asunto: Option<String>,
    pub descripcion: Option<String>,
    pub nro_infogov: Option<String>,
    pub nro_gde: Option<String>,
    pub caratula: Option<String>,
    pub resolucion_nro: Option<String>,
    pub prioridad: Option<Prioridad>,
    pub estado: Option<EstadoExpediente>,
    pub fecha_vencimiento: Option<DateTime<Utc>>,
    pub fecha_finalizacion: Option<DateTime<Utc>>,
    pub agente_responsable_id: Option<String>,
    pub observaciones: Option<String>,
}
