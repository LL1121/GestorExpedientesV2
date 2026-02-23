use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Categoría de gasto para vehículos
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CategoriaGasto {
    Combustible,
    Repuestos,
    Mantenimiento,
    Otro,
}

impl CategoriaGasto {
    pub fn from_str(s: &str) -> Self {
        match s {
            "COMBUSTIBLE" => CategoriaGasto::Combustible,
            "REPUESTOS" => CategoriaGasto::Repuestos,
            "MANTENIMIENTO" => CategoriaGasto::Mantenimiento,
            _ => CategoriaGasto::Otro,
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            CategoriaGasto::Combustible => "COMBUSTIBLE",
            CategoriaGasto::Repuestos => "REPUESTOS",
            CategoriaGasto::Mantenimiento => "MANTENIMIENTO",
            CategoriaGasto::Otro => "OTRO",
        }
    }
}

/// Resultado del análisis de clasificación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalisisGasto {
    pub categoria: CategoriaGasto,
    pub confianza: f32, // 0.0 a 1.0
    pub unidades_detectadas: Vec<String>, // Unidades/patentes encontradas
    pub palabras_clave_encontradas: Vec<String>,
}

/// Vinculación entre expediente de pago y vehículo
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ExpedienteGastoVinculo {
    pub id: String,
    pub expediente_id: String,
    pub vehiculo_id: String,
    pub categoria: String, // Almacenado como string COMBUSTIBLE, REPUESTOS, etc
    pub monto: Option<f32>,
    pub fecha_gasto: chrono::DateTime<chrono::Utc>,
    pub detectado_automaticamente: bool,
    pub confirmado_usuario: bool,
    pub observaciones: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// DTO para crear un vinculo de gasto
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateExpedienteGastoVinculo {
    pub expediente_id: String,
    pub vehiculo_id: String,
    pub categoria: String,
    pub monto: Option<f32>,
    pub fecha_gasto: chrono::DateTime<chrono::Utc>,
    pub detectado_automaticamente: bool,
    pub confirmado_usuario: bool,
    pub observaciones: Option<String>,
}
