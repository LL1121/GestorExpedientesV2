// Tauri Commands para Expedientes
// Estas funciones son invocadas desde el frontend con invoke()

use tauri::State;
use serde::{Deserialize, Serialize};

use crate::db::DatabasePool;
use crate::models::expediente::{Expediente, CreateExpediente, UpdateExpediente};
use crate::repositories::ExpedienteRepository;
use crate::utils::infogov_parser::InfoGovExpediente;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcesarExpedienteResult {
    pub success: bool,
    pub id: Option<String>,
    pub resumen: String,
    pub mensaje: String,
    pub nro_infogov: Option<String>,
}


/// Obtener todos los expedientes
#[tauri::command]
pub async fn get_expedientes(pools: State<'_, DatabasePool>) -> Result<Vec<Expediente>, String> {
    ExpedienteRepository::get_all(pools.get_sqlite())
        .await
        .map_err(|e| e.to_string())
}

/// Alias para compatibilidad
#[tauri::command]
pub async fn obtener_expedientes(pools: State<'_, DatabasePool>) -> Result<Vec<Expediente>, String> {
    get_expedientes(pools).await
}

/// Obtener un expediente por ID
#[tauri::command]
pub async fn get_expediente(pools: State<'_, DatabasePool>, id: String) -> Result<Expediente, String> {
    ExpedienteRepository::get_by_id(pools.get_sqlite(), &id)
        .await
        .map_err(|e| e.to_string())
}

/// Crear un nuevo expediente
#[tauri::command]
pub async fn create_expediente(
    pools: State<'_, DatabasePool>,
    data: CreateExpediente,
) -> Result<Expediente, String> {
    ExpedienteRepository::create(pools.get_sqlite(), data)
        .await
        .map_err(|e| e.to_string())
}

/// Actualizar un expediente existente
#[tauri::command]
pub async fn update_expediente(
    pools: State<'_, DatabasePool>,
    id: String,
    data: UpdateExpediente,
) -> Result<Expediente, String> {
    ExpedienteRepository::update(pools.get_sqlite(), &id, data)
        .await
        .map_err(|e| e.to_string())
}

/// Eliminar un expediente
#[tauri::command]
pub async fn delete_expediente(pools: State<'_, DatabasePool>, id: String) -> Result<(), String> {
    ExpedienteRepository::delete(pools.get_sqlite(), &id)
        .await
        .map_err(|e| e.to_string())
}

/// Buscar expedientes por texto
#[tauri::command]
pub async fn search_expedientes(pools: State<'_, DatabasePool>, query: String) -> Result<Vec<Expediente>, String> {
    ExpedienteRepository::search(pools.get_sqlite(), &query)
        .await
        .map_err(|e| e.to_string())
}
/// Procesar y guardar un expediente desde el portapapeles (atajo Alt+I)
/// Parsea el texto capturado, extrae datos de InfoGov y realiza un UPSERT en la base de datos
#[tauri::command]
pub async fn procesar_y_guardar_expediente(
    pools: State<'_, DatabasePool>,
    raw_text: String,
) -> Result<ProcesarExpedienteResult, String> {
    // Parsear el texto del portapapeles
    let infogov_exp = InfoGovExpediente::from_clipboard(&raw_text)?;

    println!("📋 Expediente parseado desde InfoGov:");
    println!("   nro_infogov: {}", infogov_exp.nro_infogov);
    println!("   tema: {}", infogov_exp.tema);
    println!("   nro_gde: {}", infogov_exp.nro_gde);
    println!("   fecha_pase: {}", infogov_exp.fecha_pase);
    println!("   estado: {}", infogov_exp.estado);
    println!("   resumen: {}", infogov_exp.resumen);

    // Intentar hacer UPSERT
    let result = ExpedienteRepository::upsert_from_infogov(
        pools.get_sqlite(),
        infogov_exp.clone(),
    )
    .await
    .map_err(|e| {
        eprintln!("Error al procesar expediente: {}", e);
        format!("Error al procesar expediente: {}", e)
    })?;

    Ok(ProcesarExpedienteResult {
        success: true,
        id: Some(result.id.clone()),
        resumen: infogov_exp.resumen.clone(),
        mensaje: format!(
            "✅ Expediente {} procesado correctamente",
            infogov_exp.nro_infogov
        ),
        nro_infogov: Some(infogov_exp.nro_infogov),
    })
}

/// Obtener notificaciones y expedientes pendientes
#[tauri::command]
pub async fn get_expedientes_notificaciones(pools: State<'_, DatabasePool>) -> Result<serde_json::Value, String> {
    // Obtener todos los expedientes
    let expedientes = ExpedienteRepository::get_all(pools.get_sqlite())
        .await
        .map_err(|e| e.to_string())?;

    // Contar expedientes por estado para notificaciones
    let mut stats = serde_json::json!({
        "total": expedientes.len(),
        "por_estado": {},
        "por_tipo": {},
        "vencidos": 0,
        "proximos_vencer": 0,
        "sin_pagar": 0,
        "pendientes": 0,
        "criticos": 0
    });

    let hoy = chrono::Local::now().naive_local().date();

    // Analizar expedientes y contar alertas
    let mut vencidos = Vec::new();
    let mut proximos_vencer = Vec::new();
    let mut sin_pagar = Vec::new();
    let mut pendientes = Vec::new();
    let mut criticos = 0;

    for exp in &expedientes {
        // Contar por estado - convertir enum a string
        let estado_str = format!("{:?}", exp.estado);
        stats["por_estado"]
            .as_object_mut()
            .unwrap()
            .entry(estado_str)
            .or_insert(serde_json::json!(0));
        
        if let Some(val) = stats["por_estado"].get_mut(&format!("{:?}", exp.estado)) {
            if let Some(n) = val.as_i64() {
                *val = serde_json::json!(n + 1);
            }
        }

        // Contar por tipo - convertir enum a string
        let tipo_str = format!("{:?}", exp.tipo);
        stats["por_tipo"]
            .as_object_mut()
            .unwrap()
            .entry(tipo_str)
            .or_insert(serde_json::json!(0));
        
        if let Some(val) = stats["por_tipo"].get_mut(&format!("{:?}", exp.tipo)) {
            if let Some(n) = val.as_i64() {
                *val = serde_json::json!(n + 1);
            }
        }

        // Detectar expedientes vencidos
        if let Some(fecha_venc) = &exp.fecha_vencimiento {
            let fecha_venc_date = fecha_venc.date_naive();
            if fecha_venc_date < hoy {
                vencidos.push(serde_json::json!({
                    "id": exp.id,
                    "numero": exp.numero,
                    "año": exp.año,
                    "asunto": exp.asunto,
                    "estado": format!("{:?}", exp.estado),
                    "fecha_vencimiento": fecha_venc.to_rfc3339(),
                    "dias_vencido": (hoy - fecha_venc_date).num_days()
                }));
                criticos += 1;
                stats["vencidos"] = serde_json::json!(stats["vencidos"].as_i64().unwrap_or(0) + 1);
            } else {
                // Próximo a vencer (7 días)
                let dias_para_vencer = (fecha_venc_date - hoy).num_days();
                if dias_para_vencer <= 7 && dias_para_vencer > 0 {
                    proximos_vencer.push(serde_json::json!({
                        "id": exp.id,
                        "numero": exp.numero,
                        "año": exp.año,
                        "asunto": exp.asunto,
                        "estado": format!("{:?}", exp.estado),
                        "fecha_vencimiento": fecha_venc.to_rfc3339(),
                        "dias_para_vencer": dias_para_vencer
                    }));
                    stats["proximos_vencer"] = serde_json::json!(stats["proximos_vencer"].as_i64().unwrap_or(0) + 1);
                }
            }
        }

        // Detectar expedientes de pago sin pagar
        let tipo_str = format!("{:?}", exp.tipo);
        let estado_str = format!("{:?}", exp.estado);
        if tipo_str == "Pago" && estado_str != "Finalizado" {
            sin_pagar.push(serde_json::json!({
                "id": exp.id,
                "numero": exp.numero,
                "año": exp.año,
                "asunto": exp.asunto,
                "estado": estado_str
            }));
            stats["sin_pagar"] = serde_json::json!(stats["sin_pagar"].as_i64().unwrap_or(0) + 1);
        }

        // Detectar expedientes pendientes (más de 14 días)
        let estado_str = format!("{:?}", exp.estado);
        if estado_str == "Iniciado" || estado_str == "EnProceso" {
            let fecha_inicio_date = exp.fecha_inicio.date_naive();
            let dias_pendiente = (hoy - fecha_inicio_date).num_days();
            if dias_pendiente > 14 {
                pendientes.push(serde_json::json!({
                    "id": exp.id,
                    "numero": exp.numero,
                    "año": exp.año,
                    "asunto": exp.asunto,
                    "estado": estado_str,
                    "fecha_inicio": exp.fecha_inicio.to_rfc3339(),
                    "dias_pendiente": dias_pendiente
                }));
                stats["pendientes"] = serde_json::json!(stats["pendientes"].as_i64().unwrap_or(0) + 1);
            }
        }
    }

    stats["criticos"] = serde_json::json!(criticos);

    Ok(serde_json::json!({
        "stats": stats,
        "alertas": {
            "vencidos": vencidos,
            "proximos_vencer": proximos_vencer,
            "sin_pagar": sin_pagar,
            "pendientes": pendientes
        }
    }))
}

/// Poblar la BD con datos de prueba mock
#[tauri::command]
pub async fn populate_mock_data(pools: State<'_, DatabasePool>) -> Result<String, String> {
    use chrono::{Utc, Duration};

    let hoy = Utc::now();
    let hace_5_dias = hoy - Duration::days(5);
    let hace_3_dias = hoy - Duration::days(3);
    let hace_12_dias = hoy - Duration::days(12);
    let hace_21_dias = hoy - Duration::days(21);

    let expedientes = vec![
        // VENCIDOS
        CreateExpediente {
            numero: "EXP-001".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::InfoGov,
            asunto: "Solicitud de compra de materiales".to_string(),
            descripcion: Some("Material para obras".to_string()),
            area_responsable: "Obras".to_string(),
            prioridad: crate::models::expediente::Prioridad::Alta,
            fecha_inicio: hace_21_dias,
            fecha_vencimiento: Some(hace_5_dias),
            archivo: Some("Construcción".to_string()),
            nro_infogov: Some("2024-001-456".to_string()),
            tema: Some("Materiales".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
        CreateExpediente {
            numero: "EXP-002".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::Interno,
            asunto: "Resolución de conflicto laboral".to_string(),
            descripcion: Some("Mediación entre partes".to_string()),
            area_responsable: "Recursos Humanos".to_string(),
            prioridad: crate::models::expediente::Prioridad::Alta,
            fecha_inicio: hace_12_dias,
            fecha_vencimiento: Some(hace_3_dias),
            archivo: Some("RRHH".to_string()),
            nro_infogov: None,
            tema: Some("Conflicto Laboral".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
        CreateExpediente {
            numero: "EXP-003".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::InfoGov,
            asunto: "Autorización de gastos especiales".to_string(),
            descripcion: Some("Gastos para conferencia".to_string()),
            area_responsable: "Administración".to_string(),
            prioridad: crate::models::expediente::Prioridad::Media,
            fecha_inicio: hace_21_dias,
            fecha_vencimiento: Some(hace_12_dias),
            archivo: Some("Gastos".to_string()),
            nro_infogov: Some("2024-002-789".to_string()),
            tema: Some("Gastos Especiales".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
        // PRÓXIMOS A VENCER
        CreateExpediente {
            numero: "EXP-004".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::Gde,
            asunto: "Trámite de licencia municipal".to_string(),
            descripcion: Some("Renovación anual".to_string()),
            area_responsable: "Legal".to_string(),
            prioridad: crate::models::expediente::Prioridad::Alta,
            fecha_inicio: hace_12_dias,
            fecha_vencimiento: Some(hoy + Duration::days(3)),
            archivo: Some("Licencias".to_string()),
            nro_infogov: None,
            tema: Some("Licencia".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: Some("2026-GDE-123".to_string()),
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
        CreateExpediente {
            numero: "EXP-005".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::InfoGov,
            asunto: "Inspección de seguridad".to_string(),
            descripcion: Some("Inspección anual".to_string()),
            area_responsable: "Seguridad".to_string(),
            prioridad: crate::models::expediente::Prioridad::Alta,
            fecha_inicio: hace_12_dias,
            fecha_vencimiento: Some(hoy + Duration::days(2)),
            archivo: Some("Seguridad".to_string()),
            nro_infogov: Some("2024-003-123".to_string()),
            tema: Some("Inspección".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
        // ÓRDENES DE COMPRA
        CreateExpediente {
            numero: "PAG-001".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::Pago,
            asunto: "Orden de compra - Equipos informáticos".to_string(),
            descripcion: Some("Laptops y periféricos".to_string()),
            area_responsable: "Compras".to_string(),
            prioridad: crate::models::expediente::Prioridad::Media,
            fecha_inicio: hace_12_dias,
            fecha_vencimiento: Some(hoy + Duration::days(5)),
            archivo: Some("Equipos".to_string()),
            nro_infogov: None,
            tema: Some("Equipamiento".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: Some("Empresa XYZ".to_string()),
            oc_domicilio: Some("Calle Principal 123".to_string()),
            oc_cuit: Some("20-12345678-9".to_string()),
            oc_descripcion_zona: Some("Centro".to_string()),
            oc_forma_pago: Some("Transferencia".to_string()),
            oc_plazo_entrega: Some("15 días".to_string()),
            factura_path: None,
        },
        CreateExpediente {
            numero: "PAG-002".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::Pago,
            asunto: "Factura por servicios profesionales".to_string(),
            descripcion: Some("Asesoría legal".to_string()),
            area_responsable: "Legal".to_string(),
            prioridad: crate::models::expediente::Prioridad::Media,
            fecha_inicio: hace_21_dias,
            fecha_vencimiento: Some(hoy + Duration::days(7)),
            archivo: Some("Servicios".to_string()),
            nro_infogov: None,
            tema: Some("Asesoría".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: Some("Estudio Jurídico ABC".to_string()),
            oc_domicilio: Some("Av. Reforma 456".to_string()),
            oc_cuit: Some("23-98765432-1".to_string()),
            oc_descripcion_zona: Some("Norte".to_string()),
            oc_forma_pago: Some("Cheque".to_string()),
            oc_plazo_entrega: Some("Inmediato".to_string()),
            factura_path: None,
        },
        // PENDIENTES
        CreateExpediente {
            numero: "EXP-009".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::Interno,
            asunto: "Evaluación de ofertas de proveedores".to_string(),
            descripcion: Some("Análisis de ofertas".to_string()),
            area_responsable: "Compras".to_string(),
            prioridad: crate::models::expediente::Prioridad::Media,
            fecha_inicio: hace_21_dias,
            fecha_vencimiento: None,
            archivo: Some("Proveedores".to_string()),
            nro_infogov: None,
            tema: Some("Ofertas".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
        CreateExpediente {
            numero: "EXP-010".to_string(),
            año: 2026,
            tipo: crate::models::expediente::TipoExpediente::InfoGov,
            asunto: "Revisión de documentación técnica".to_string(),
            descripcion: Some("Auditoría técnica".to_string()),
            area_responsable: "Sistemas".to_string(),
            prioridad: crate::models::expediente::Prioridad::Media,
            fecha_inicio: hace_21_dias + Duration::days(3),
            fecha_vencimiento: None,
            archivo: Some("Sistemas".to_string()),
            nro_infogov: Some("2024-004-456".to_string()),
            tema: Some("Auditoría".to_string()),
            agente_responsable_id: None,
            caratula: None,
            resolucion_nro: None,
            nro_gde: None,
            fecha_pase: None,
            oficina: None,
            buzon_grupal: None,
            hacer: None,
            oc_señor: None,
            oc_domicilio: None,
            oc_cuit: None,
            oc_descripcion_zona: None,
            oc_forma_pago: None,
            oc_plazo_entrega: None,
            factura_path: None,
        },
    ];

    let mut count = 0;
    for exp in expedientes {
        match ExpedienteRepository::create(pools.get_sqlite(), exp).await {
            Ok(_) => count += 1,
            Err(e) => eprintln!("Error insertando expediente: {}", e),
        }
    }

    Ok(format!("Se insertaron {} expedientes de prueba", count))
}
