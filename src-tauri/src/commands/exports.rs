// Tauri Commands para exportación de informes en Excel.

use std::collections::HashSet;

use chrono::Utc;
use sqlx::FromRow;
use tauri::State;

use crate::db::DatabasePool;

#[derive(Debug, FromRow)]
struct ExpedientePendienteRow {
    nro_infogov: Option<String>,
    nro_gde: Option<String>,
    fecha_envio_gde: Option<String>,
    tema: Option<String>,
    nombre_proveedor: Option<String>,
    monto: Option<f64>,
}

#[derive(Debug, FromRow)]
struct ColumnInfo {
    name: String,
}

#[tauri::command]
pub async fn exportar_excel_pendientes(
    pools: State<'_, DatabasePool>,
) -> Result<String, String> {
    let pool = pools.get_sqlite();
    let columns = get_expedientes_columns(pool).await?;

    let has_pagado = columns.contains("pagado");
    let where_pago = if has_pagado {
        "(pagado IS NULL OR CAST(pagado AS TEXT) IN ('0', 'false', 'FALSE', ''))"
    } else {
        "(estado IS NULL OR UPPER(REPLACE(estado, '_', '')) <> 'FINALIZADO')"
    };

    let tema_col = pick_column(&columns, &["tema", "asunto"]).unwrap_or("''");
    let proveedor_col = pick_column(&columns, &["nombre_proveedor", "oc_señor"]).unwrap_or("''");
    let fecha_col = pick_column(&columns, &["fecha_envio_gde", "fecha_pase", "created_at"])
        .unwrap_or("created_at");
    let monto_col = pick_column(&columns, &["monto", "monto_total"]).unwrap_or("0");
    let nro_infogov_col = pick_column(&columns, &["nro_infogov"]).unwrap_or("''");
    let nro_gde_col = pick_column(&columns, &["nro_gde"]).unwrap_or("''");

    let query = format!(
        r#"
        SELECT
            {nro_infogov_col} AS nro_infogov,
            {nro_gde_col} AS nro_gde,
            {fecha_col} AS fecha_envio_gde,
            {tema_col} AS tema,
            {proveedor_col} AS nombre_proveedor,
            CAST({monto_col} AS REAL) AS monto
        FROM expedientes
        WHERE UPPER(tipo) = 'PAGO'
          AND {where_pago}
        ORDER BY
          CASE WHEN {fecha_col} IS NULL OR {fecha_col} = '' THEN 1 ELSE 0 END,
          datetime({fecha_col}) ASC,
          created_at ASC
        "#
    );

    let expedientes = sqlx::query_as::<_, ExpedientePendienteRow>(&query)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Error al obtener expedientes pendientes: {}", e))?;

    if expedientes.is_empty() {
        return Err("No hay expedientes de pago pendientes para exportar".to_string());
    }

    let template_path = resolve_template_path()?;
    let docs_dir = dirs::home_dir()
        .ok_or("No se pudo obtener el directorio home")?
        .join("Documents");
    std::fs::create_dir_all(&docs_dir)
        .map_err(|e| format!("Error al crear directorio de salida: {}", e))?;

    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let output_path = docs_dir.join(format!("Informe_Pendientes_{}.xlsx", timestamp));

    std::fs::copy(&template_path, &output_path)
        .map_err(|e| format!("Error al copiar plantilla Excel: {}", e))?;

    let mut book = umya_spreadsheet::reader::xlsx::read(&output_path)
        .map_err(|e| format!("Error al leer plantilla Excel: {:?}", e))?;

    let sheet_title = book
        .get_sheet(0)
        .map_err(|e| format!("Error al acceder a la hoja de plantilla: {}", e))?
        .get_title()
        .to_string();
    if expedientes.len() > 1 {
        book.insert_new_row(sheet_title.clone(), 5, (expedientes.len() - 1) as u32);
    }

    {
        let sheet = book
            .get_sheet_by_name_mut(sheet_title)
            .map_err(|e| format!("Error al obtener hoja de Excel: {}", e))?;

        for (index, exp) in expedientes.iter().enumerate() {
            let row = 4u32 + index as u32;

            clone_template_style(sheet, 4, row, 1);
            clone_template_style(sheet, 4, row, 2);
            clone_template_style(sheet, 4, row, 3);
            clone_template_style(sheet, 4, row, 4);
            clone_template_style(sheet, 4, row, 6);
            clone_template_style(sheet, 4, row, 7);
            clone_template_style(sheet, 4, row, 10);

            set_string_cell(sheet, row, 1, "Malargüe");
            set_string_cell(sheet, row, 2, exp.nro_infogov.as_deref().unwrap_or(""));
            set_string_cell(sheet, row, 3, exp.nro_gde.as_deref().unwrap_or(""));
            set_string_cell(sheet, row, 4, &format_date_ddmmyyyy(exp.fecha_envio_gde.as_deref()));
            set_string_cell(sheet, row, 6, exp.tema.as_deref().unwrap_or(""));
            set_string_cell(sheet, row, 7, exp.nombre_proveedor.as_deref().unwrap_or(""));
            set_amount_cell(sheet, row, 10, exp.monto.unwrap_or(0.0));
        }
    }

    umya_spreadsheet::writer::xlsx::write(&book, &output_path)
        .map_err(|e| format!("Error al guardar informe Excel: {:?}", e))?;

    Ok(output_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn exportar_excel_todos(pools: State<'_, DatabasePool>) -> Result<String, String> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM expedientes")
        .fetch_one(pools.get_sqlite())
        .await
        .map_err(|e| format!("Error al obtener expedientes: {}", e))?;
    Ok(format!("Expedientes totales: {}", count))
}

#[tauri::command]
pub async fn exportar_excel_movilidades(pools: State<'_, DatabasePool>) -> Result<String, String> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM vehiculos")
        .fetch_one(pools.get_sqlite())
        .await
        .map_err(|e| format!("Error al obtener vehículos: {}", e))?;
    Ok(format!("Vehículos totales: {}", count))
}

#[tauri::command]
pub async fn exportar_excel_personal(pools: State<'_, DatabasePool>) -> Result<String, String> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM agentes")
        .fetch_one(pools.get_sqlite())
        .await
        .map_err(|e| format!("Error al obtener personal: {}", e))?;
    Ok(format!("Agentes totales: {}", count))
}

async fn get_expedientes_columns(pool: &sqlx::SqlitePool) -> Result<HashSet<String>, String> {
    let columns = sqlx::query_as::<_, ColumnInfo>("PRAGMA table_info(expedientes)")
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Error consultando columnas de expedientes: {}", e))?;

    Ok(columns.into_iter().map(|item| item.name).collect())
}

fn pick_column<'a>(columns: &HashSet<String>, options: &'a [&'a str]) -> Option<&'a str> {
    options.iter().copied().find(|name| columns.contains(*name))
}

fn resolve_template_path() -> Result<std::path::PathBuf, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Error al obtener ejecutable actual: {}", e))?;
    let exe_parent = exe_dir
        .parent()
        .ok_or("No se pudo obtener directorio del ejecutable")?;

    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Error al obtener directorio de trabajo: {}", e))?;

    let candidates = [
        exe_parent.join("resources/templates/Modelo_resumen_pago.xlsx"),
        current_dir.join("resources/templates/Modelo_resumen_pago.xlsx"),
        current_dir.join("src-tauri/resources/templates/Modelo_resumen_pago.xlsx"),
    ];

    candidates
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| "No se encontró la plantilla Modelo_resumen_pago.xlsx".to_string())
}

fn set_string_cell(sheet: &mut umya_spreadsheet::Worksheet, row: u32, col: u32, value: &str) {
    sheet
        .get_cell_mut(format!("{}{}", column_to_letter(col), row))
        .set_value(value);
}

fn set_amount_cell(sheet: &mut umya_spreadsheet::Worksheet, row: u32, col: u32, value: f64) {
    sheet
        .get_cell_mut(format!("{}{}", column_to_letter(col), row))
        .set_value(format!("{:.2}", value));
}

fn clone_template_style(
    sheet: &mut umya_spreadsheet::Worksheet,
    template_row: u32,
    target_row: u32,
    col: u32,
) {
    if template_row == target_row {
        return;
    }

    let style = sheet.get_style_by_column_and_row(col, template_row).clone();
    sheet.set_style_by_column_and_row(col, target_row, style);
}

fn format_date_ddmmyyyy(raw: Option<&str>) -> String {
    let Some(value) = raw else {
        return String::new();
    };

    let trimmed = value.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    if let Ok(date) = chrono::NaiveDate::parse_from_str(trimmed, "%Y-%m-%d") {
        return date.format("%d/%m/%Y").to_string();
    }

    if let Ok(date_time) = chrono::DateTime::parse_from_rfc3339(trimmed) {
        return date_time.format("%d/%m/%Y").to_string();
    }

    if let Ok(date_time) = chrono::NaiveDateTime::parse_from_str(trimmed, "%Y-%m-%d %H:%M:%S") {
        return date_time.format("%d/%m/%Y").to_string();
    }

    trimmed.to_string()
}

fn column_to_letter(col: u32) -> String {
    let mut current = col;
    let mut result = String::new();

    while current > 0 {
        current -= 1;
        result.insert(0, (b'A' + (current % 26) as u8) as char);
        current /= 26;
    }

    result
}
