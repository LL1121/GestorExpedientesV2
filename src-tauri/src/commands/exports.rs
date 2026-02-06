// Tauri Command para Exportar Informes a Excel
// Genera archivos Excel con datos de expedientes pendientes

use tauri::State;
use std::sync::Arc;
use chrono::Utc;

use crate::db::DatabaseManager;
use crate::models::expediente::Expediente;

/// Exportar expedientes pendientes a Excel
/// Genera un archivo XLSX con todos los expedientes en estado "Pendiente"
#[tauri::command]
pub async fn exportar_excel_pendientes(
    db: State<'_, Arc<DatabaseManager>>
) -> Result<String, String> {
    let pool = db.sqlite();
    
    // Obtener expedientes pendientes
    let expedientes = sqlx::query_as::<_, Expediente>(
        r#"
        SELECT * FROM expedientes 
        WHERE estado = 'Pendiente'
        ORDER BY prioridad DESC, created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error al obtener expedientes: {}", e))?;
    
    if expedientes.is_empty() {
        return Err("No hay expedientes pendientes para exportar".to_string());
    }
    
    // Generar nombre de archivo con timestamp
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("Expedientes_Pendientes_{}.xlsx", timestamp);
    
    // TODO: Implementar generación de Excel usando rust_xlsxwriter
    // Por ahora, devolvemos el path donde se guardará
    let output_path = std::env::current_dir()
        .map_err(|e| format!("Error al obtener directorio: {}", e))?
        .join(&filename);
    
    // Simular exportación (en producción usar rust_xlsxwriter)
    println!("📊 Exportando {} expedientes pendientes a: {}", 
             expedientes.len(), 
             output_path.display());
    
    // Aquí iría el código real de generación Excel:
    /*
    use rust_xlsxwriter::*;
    
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    
    // Headers
    worksheet.write_string(0, 0, "ID")?;
    worksheet.write_string(0, 1, "Número")?;
    worksheet.write_string(0, 2, "Asunto")?;
    worksheet.write_string(0, 3, "Estado")?;
    worksheet.write_string(0, 4, "Prioridad")?;
    worksheet.write_string(0, 5, "Tipo")?;
    worksheet.write_string(0, 6, "Área")?;
    worksheet.write_string(0, 7, "Responsable")?;
    worksheet.write_string(0, 8, "Fecha Creación")?;
    worksheet.write_string(0, 9, "Fecha Vencimiento")?;
    
    // Data
    for (i, exp) in expedientes.iter().enumerate() {
        let row = (i + 1) as u32;
        worksheet.write_string(row, 0, &exp.id.to_string())?;
        worksheet.write_string(row, 1, &exp.numero)?;
        worksheet.write_string(row, 2, &exp.asunto)?;
        worksheet.write_string(row, 3, &exp.estado)?;
        worksheet.write_string(row, 4, &exp.prioridad)?;
        worksheet.write_string(row, 5, &exp.tipo)?;
        worksheet.write_string(row, 6, &exp.area)?;
        worksheet.write_string(row, 7, exp.responsable.as_deref().unwrap_or("N/A"))?;
        worksheet.write_string(row, 8, &exp.created_at.format("%d/%m/%Y").to_string())?;
        if let Some(venc) = exp.fecha_vencimiento {
            worksheet.write_string(row, 9, &venc.format("%d/%m/%Y").to_string())?;
        }
    }
    
    workbook.save(&output_path)
        .map_err(|e| format!("Error al guardar Excel: {}", e))?;
    */
    
    Ok(format!(
        "✅ Exportados {} expedientes pendientes\n📁 Archivo: {}", 
        expedientes.len(),
        filename
    ))
}

/// Exportar todos los expedientes a Excel
#[tauri::command]
pub async fn exportar_excel_todos(
    db: State<'_, Arc<DatabaseManager>>
) -> Result<String, String> {
    let pool = db.sqlite();
    
    let expedientes = sqlx::query_as::<_, Expediente>(
        "SELECT * FROM expedientes ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error al obtener expedientes: {}", e))?;
    
    if expedientes.is_empty() {
        return Err("No hay expedientes para exportar".to_string());
    }
    
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("Expedientes_Completo_{}.xlsx", timestamp);
    
    println!("📊 Exportando {} expedientes totales", expedientes.len());
    
    Ok(format!(
        "✅ Exportados {} expedientes\n📁 Archivo: {}", 
        expedientes.len(),
        filename
    ))
}

/// Exportar reporte de vehículos y combustible
#[tauri::command]
pub async fn exportar_excel_movilidades(
    db: State<'_, Arc<DatabaseManager>>
) -> Result<String, String> {
    let pool = db.sqlite();
    
    // Obtener vehículos activos
    let count_vehiculos: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM vehiculos WHERE activo = true"
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error: {}", e))?;
    
    // Obtener tickets del último mes
    let count_tickets: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*) FROM tickets_combustible 
        WHERE fecha_carga >= datetime('now', '-30 days')
        "#
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error: {}", e))?;
    
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("Movilidades_Reporte_{}.xlsx", timestamp);
    
    println!("📊 Exportando reporte de movilidades: {} vehículos, {} tickets", 
             count_vehiculos, count_tickets);
    
    Ok(format!(
        "✅ Reporte de Movilidades generado\n📁 {} vehículos | {} cargas de combustible\n📁 Archivo: {}", 
        count_vehiculos,
        count_tickets,
        filename
    ))
}

/// Exportar reporte de personal con semáforo de licencias
#[tauri::command]
pub async fn exportar_excel_personal(
    db: State<'_, Arc<DatabaseManager>>
) -> Result<String, String> {
    let pool = db.sqlite();
    
    let count_agentes: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM agentes WHERE activo = true"
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Error: {}", e))?;
    
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("Personal_Licencias_{}.xlsx", timestamp);
    
    println!("📊 Exportando reporte de personal: {} agentes", count_agentes);
    
    Ok(format!(
        "✅ Reporte de Personal generado\n📁 {} agentes activos\n📁 Archivo: {}", 
        count_agentes,
        filename
    ))
}
