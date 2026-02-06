// Repositorio de Expedientes
// Maneja todas las operaciones de base de datos para expedientes

use sqlx::{Pool, Sqlite};
use uuid::Uuid;
use chrono::Utc;

use crate::models::expediente::{Expediente, CreateExpediente, UpdateExpediente};
use crate::error::{AppResult, AppError};

pub struct ExpedienteRepository;

impl ExpedienteRepository {
    /// Obtener todos los expedientes
    pub async fn get_all(pool: &Pool<Sqlite>) -> AppResult<Vec<Expediente>> {
        let expedientes = sqlx::query_as::<_, Expediente>(
            "SELECT * FROM expedientes ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await?;
        
        Ok(expedientes)
    }
    
    /// Obtener un expediente por ID
    pub async fn get_by_id(pool: &Pool<Sqlite>, id: Uuid) -> AppResult<Expediente> {
        let expediente = sqlx::query_as::<_, Expediente>(
            "SELECT * FROM expedientes WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Expediente {} no encontrado", id)))?;
        
        Ok(expediente)
    }
    
    /// Crear un nuevo expediente
    pub async fn create(pool: &Pool<Sqlite>, data: CreateExpediente) -> AppResult<Expediente> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        
        let tipo_str = format!("{:?}", data.tipo).to_uppercase();
        let prioridad_str = format!("{:?}", data.prioridad).to_uppercase();
        let estado_str = "INICIADO"; // Estado inicial por defecto
        
        sqlx::query(
            r#"
            INSERT INTO expedientes (
                id, numero, año, tipo, asunto, descripcion,
                area_responsable, prioridad, estado,
                fecha_inicio, fecha_vencimiento, agente_responsable_id,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(id.to_string())
        .bind(&data.numero)
        .bind(data.año)
        .bind(tipo_str)
        .bind(&data.asunto)
        .bind(&data.descripcion)
        .bind(&data.area_responsable)
        .bind(prioridad_str)
        .bind(estado_str)
        .bind(data.fecha_inicio)
        .bind(data.fecha_vencimiento)
        .bind(data.agente_responsable_id.map(|id| id.to_string()))
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;
        
        Self::get_by_id(pool, id).await
    }
    
    /// Actualizar un expediente existente
    pub async fn update(pool: &Pool<Sqlite>, id: Uuid, data: UpdateExpediente) -> AppResult<Expediente> {
        // Verificar que el expediente existe
        let _ = Self::get_by_id(pool, id).await?;
        
        // Construir la query de actualización dinámicamente
        let mut query = "UPDATE expedientes SET updated_at = ? WHERE id = ?".to_string();
        
        if data.asunto.is_some() {
            query = query.replace("WHERE", ", asunto = ? WHERE");
        }
        if data.descripcion.is_some() {
            query = query.replace("WHERE", ", descripcion = ? WHERE");
        }
        if data.prioridad.is_some() {
            query = query.replace("WHERE", ", prioridad = ? WHERE");
        }
        if data.estado.is_some() {
            query = query.replace("WHERE", ", estado = ? WHERE");
        }
        if data.fecha_vencimiento.is_some() {
            query = query.replace("WHERE", ", fecha_vencimiento = ? WHERE");
        }
        if data.fecha_finalizacion.is_some() {
            query = query.replace("WHERE", ", fecha_finalizacion = ? WHERE");
        }
        if data.agente_responsable_id.is_some() {
            query = query.replace("WHERE", ", agente_responsable_id = ? WHERE");
        }
        if data.observaciones.is_some() {
            query = query.replace("WHERE", ", observaciones = ? WHERE");
        }
        
        let mut query_builder = sqlx::query(&query).bind(Utc::now()).bind(id.to_string());
        
        if let Some(asunto) = data.asunto {
            query_builder = query_builder.bind(asunto);
        }
        if let Some(descripcion) = data.descripcion {
            query_builder = query_builder.bind(descripcion);
        }
        if let Some(prioridad) = data.prioridad {
            query_builder = query_builder.bind(format!("{:?}", prioridad).to_uppercase());
        }
        if let Some(estado) = data.estado {
            query_builder = query_builder.bind(format!("{:?}", estado).to_uppercase());
        }
        if let Some(fecha_venc) = data.fecha_vencimiento {
            query_builder = query_builder.bind(fecha_venc);
        }
        if let Some(fecha_fin) = data.fecha_finalizacion {
            query_builder = query_builder.bind(fecha_fin);
        }
        if let Some(agente_id) = data.agente_responsable_id {
            query_builder = query_builder.bind(agente_id.to_string());
        }
        if let Some(obs) = data.observaciones {
            query_builder = query_builder.bind(obs);
        }
        
        query_builder.execute(pool).await?;
        
        Self::get_by_id(pool, id).await
    }
    
    /// Eliminar un expediente
    pub async fn delete(pool: &Pool<Sqlite>, id: Uuid) -> AppResult<()> {
        let result = sqlx::query("DELETE FROM expedientes WHERE id = ?")
            .bind(id.to_string())
            .execute(pool)
            .await?;
        
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Expediente {} no encontrado", id)));
        }
        
        Ok(())
    }
    
    /// Buscar expedientes por texto (número o asunto)
    pub async fn search(pool: &Pool<Sqlite>, query: &str) -> AppResult<Vec<Expediente>> {
        let search_pattern = format!("%{}%", query);
        
        let expedientes = sqlx::query_as::<_, Expediente>(
            "SELECT * FROM expedientes 
             WHERE numero LIKE ? OR asunto LIKE ?
             ORDER BY created_at DESC"
        )
        .bind(&search_pattern)
        .bind(&search_pattern)
        .fetch_all(pool)
        .await?;
        
        Ok(expedientes)
    }
}
