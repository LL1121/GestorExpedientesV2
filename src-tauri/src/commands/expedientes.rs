// Tauri Commands para Expedientes
// Estas funciones son invocadas desde el frontend con invoke()

use serde::{Deserialize, Serialize};
use sqlx::Row;
use crate::db::DatabasePool;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExpedienteData {
    pub id: String,
    pub numero: String,
    pub año: i32,
    pub asunto: String,
    pub descripcion: String,
    pub tipo: String,
    pub estado: String,
    pub area: String,
    pub solicitante: String,
}

/// Obtener todos los expedientes con fallback automático
/// PostgreSQL → SQLite (si PostgreSQL falla)
#[tauri::command]
pub async fn obtener_expedientes(
    pools: tauri::State<'_, DatabasePool>,
) -> Result<Vec<ExpedienteData>, String> {
    // Intentar obtener de PostgreSQL primero
    if let Some(pg_pool) = &pools.postgres {
        match get_expedientes_postgres(pg_pool).await {
            Ok(expedientes) => {
                println!("✓ Expedientes obtenidos de PostgreSQL");
                return Ok(expedientes);
            }
            Err(e) => {
                eprintln!("⚠️ Error PostgreSQL: {}. Usando SQLite local...", e);
            }
        }
    }

    // Fallback a SQLite
    match get_expedientes_sqlite(&pools.sqlite).await {
        Ok(expedientes) => {
            println!("✓ Expedientes obtenidos de SQLite");
            Ok(expedientes)
        }
        Err(e) => {
            eprintln!("✗ Error al obtener expedientes: {}", e);
            Err(e.to_string())
        }
    }
}

/// Obtiene expedientes desde PostgreSQL
async fn get_expedientes_postgres(pool: &sqlx::PgPool) -> Result<Vec<ExpedienteData>, sqlx::Error> {
    let expedientes = sqlx::query_as::<_, ExpedienteData>(
        r#"
        SELECT id::text, numero, año, asunto, descripcion, tipo, estado, area, solicitante
        FROM expedientes
        ORDER BY año DESC, numero DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(expedientes)
}

/// Obtiene expedientes desde SQLite
async fn get_expedientes_sqlite(pool: &sqlx::SqlitePool) -> Result<Vec<ExpedienteData>, sqlx::Error> {
    let expedientes = sqlx::query_as::<_, ExpedienteData>(
        r#"
        SELECT id, numero, año, asunto, descripcion, tipo, estado, area, solicitante
        FROM expedientes
        ORDER BY año DESC, numero DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(expedientes)
}
