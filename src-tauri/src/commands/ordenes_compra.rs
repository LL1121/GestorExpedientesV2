// Comandos Tauri para Órdenes de Compra
use crate::db::DatabasePool;
use crate::models::orden_compra::*;
use crate::utils::excel_generator::{ejecutar_conversion_excel_a_pdf_con_datos, OCExcelData, OCRenglon};
use chrono::{Datelike, NaiveDate};
use serde::Serialize;
use sqlx::{Row, SqlitePool, PgPool};
use uuid::Uuid;

/// Obtener todos los proveedores
#[tauri::command]
pub async fn obtener_proveedores(
    pools: tauri::State<'_, DatabasePool>,
) -> Result<Vec<Proveedor>, String> {
    if let Some(pg_pool) = &pools.postgres {
        match get_proveedores_postgres(pg_pool).await {
            Ok(proveedores) => {
                println!("✓ Proveedores obtenidos de PostgreSQL");
                return Ok(proveedores);
            }
            Err(e) => {
                eprintln!("⚠️ Error PostgreSQL: {}. Usando SQLite local...", e);
            }
        }
    }

    match get_proveedores_sqlite(&pools.sqlite).await {
        Ok(proveedores) => {
            println!("✓ Proveedores obtenidos de SQLite");
            Ok(proveedores)
        }
        Err(e) => {
            eprintln!("✗ Error al obtener proveedores: {}", e);
            Err(e.to_string())
        }
    }
}

async fn get_proveedores_postgres(pool: &PgPool) -> Result<Vec<Proveedor>, sqlx::Error> {
    let proveedores = sqlx::query_as::<_, Proveedor>(
        "SELECT id::text, nombre, cuit, domicilio FROM proveedores ORDER BY nombre"
    )
    .fetch_all(pool)
    .await?;
    Ok(proveedores)
}

async fn get_proveedores_sqlite(pool: &SqlitePool) -> Result<Vec<Proveedor>, sqlx::Error> {
    let proveedores = sqlx::query_as::<_, Proveedor>(
        "SELECT id, nombre, cuit, domicilio FROM proveedores ORDER BY nombre"
    )
    .fetch_all(pool)
    .await?;
    Ok(proveedores)
}

/// Crear un nuevo proveedor
#[tauri::command]
pub async fn crear_proveedor(
    pools: tauri::State<'_, DatabasePool>,
    data: CreateProveedor,
) -> Result<Proveedor, String> {
    let id = Uuid::new_v4().to_string();
    
    if let Some(pg_pool) = &pools.postgres {
        match create_proveedor_postgres(pg_pool, &id, &data).await {
            Ok(proveedor) => return Ok(proveedor),
            Err(e) => eprintln!("⚠️ Error PostgreSQL: {}", e),
        }
    }

    create_proveedor_sqlite(&pools.sqlite, &id, &data)
        .await
        .map_err(|e| e.to_string())
}

async fn create_proveedor_postgres(pool: &PgPool, id: &str, data: &CreateProveedor) -> Result<Proveedor, sqlx::Error> {
    let proveedor = sqlx::query_as::<_, Proveedor>(
        r#"
        INSERT INTO proveedores (id, nombre, cuit, domicilio)
        VALUES ($1::uuid, $2, $3, $4)
        RETURNING id::text, nombre, cuit, domicilio
        "#
    )
    .bind(id)
    .bind(&data.nombre)
    .bind(&data.cuit)
    .bind(&data.domicilio)
    .fetch_one(pool)
    .await?;
    Ok(proveedor)
}

async fn create_proveedor_sqlite(pool: &SqlitePool, id: &str, data: &CreateProveedor) -> Result<Proveedor, sqlx::Error> {
    sqlx::query(
        "INSERT INTO proveedores (id, nombre, cuit, domicilio) VALUES (?, ?, ?, ?)"
    )
    .bind(id)
    .bind(&data.nombre)
    .bind(&data.cuit)
    .bind(&data.domicilio)
    .execute(pool)
    .await?;

    Ok(Proveedor {
        id: id.to_string(),
        nombre: data.nombre.clone(),
        cuit: data.cuit.clone(),
        domicilio: data.domicilio.clone(),
    })
}

/// Obtener configuración de topes
#[tauri::command]
pub async fn obtener_config_topes(
    pools: tauri::State<'_, DatabasePool>,
) -> Result<Vec<ConfigTope>, String> {
    if let Some(pg_pool) = &pools.postgres {
        match get_topes_postgres(pg_pool).await {
            Ok(topes) => return Ok(topes),
            Err(e) => eprintln!("⚠️ Error PostgreSQL: {}", e),
        }
    }

    get_topes_sqlite(&pools.sqlite)
        .await
        .map_err(|e| e.to_string())
}

async fn get_topes_postgres(pool: &PgPool) -> Result<Vec<ConfigTope>, sqlx::Error> {
    let topes = sqlx::query_as::<_, ConfigTope>(
        "SELECT id, tipo_contratacion, monto_maximo::float8 as monto_maximo FROM config_topes ORDER BY monto_maximo"
    )
    .fetch_all(pool)
    .await?;
    Ok(topes)
}

async fn get_topes_sqlite(pool: &SqlitePool) -> Result<Vec<ConfigTope>, sqlx::Error> {
    let topes = sqlx::query_as::<_, ConfigTope>(
        "SELECT id, tipo_contratacion, monto_maximo FROM config_topes ORDER BY monto_maximo"
    )
    .fetch_all(pool)
    .await?;
    Ok(topes)
}

/// Actualizar un tope de configuración
#[tauri::command]
pub async fn actualizar_config_tope(
    pools: tauri::State<'_, DatabasePool>,
    data: UpdateConfigTope,
) -> Result<ConfigTope, String> {
    if let Some(pg_pool) = &pools.postgres {
        match update_tope_postgres(pg_pool, &data).await {
            Ok(tope) => return Ok(tope),
            Err(e) => eprintln!("⚠️ Error PostgreSQL: {}", e),
        }
    }

    update_tope_sqlite(&pools.sqlite, &data)
        .await
        .map_err(|e| e.to_string())
}

async fn update_tope_postgres(pool: &PgPool, data: &UpdateConfigTope) -> Result<ConfigTope, sqlx::Error> {
    let tope = sqlx::query_as::<_, ConfigTope>(
        r#"
        UPDATE config_topes 
        SET monto_maximo = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, tipo_contratacion, monto_maximo::float8 as monto_maximo
        "#
    )
    .bind(data.monto_maximo)
    .bind(data.id)
    .fetch_one(pool)
    .await?;
    Ok(tope)
}

async fn update_tope_sqlite(pool: &SqlitePool, data: &UpdateConfigTope) -> Result<ConfigTope, sqlx::Error> {
    sqlx::query(
        "UPDATE config_topes SET monto_maximo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(data.monto_maximo)
    .bind(data.id)
    .execute(pool)
    .await?;

    let tope = sqlx::query_as::<_, ConfigTope>(
        "SELECT id, tipo_contratacion, monto_maximo FROM config_topes WHERE id = ?"
    )
    .bind(data.id)
    .fetch_one(pool)
    .await?;
    Ok(tope)
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ExpedienteOCData {
    pub id: String,
    pub numero: String,
    pub año: i32,
    pub asunto: String,
    pub nro_infogov: Option<String>,
    pub nro_gde: Option<String>,
    pub caratula: Option<String>,
    pub resolucion_nro: Option<String>,
    // Campos específicos para OC
    pub oc_señor: Option<String>,
    pub oc_domicilio: Option<String>,
    pub oc_cuit: Option<String>,
    pub oc_descripcion_zona: Option<String>,
    pub oc_forma_pago: Option<String>,
    pub oc_plazo_entrega: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct NuevaOCPreparada {
    pub expediente: ExpedienteOCData,
    pub numero_oc: String,
    pub pedido_nro: i32,
    pub fecha: String,
    pub destino: String,
    pub forma_pago: String,
    pub plazo_entrega: String,
    pub es_iva_inscripto: bool,
    pub tipo_contratacion: String,
    pub subtotal: f64,
    pub iva: f64,
    pub total: f64,
    pub total_en_letras: String,
}

/// Preparar una nueva OC a partir de un expediente
#[tauri::command]
pub async fn preparar_nueva_oc(
    pools: tauri::State<'_, DatabasePool>,
    expediente_id: String,
) -> Result<NuevaOCPreparada, String> {
    println!("📦 Preparando OC para expediente: {}", expediente_id);
    
    if let Some(pg_pool) = &pools.postgres {
        match preparar_nueva_oc_postgres(pg_pool, &expediente_id).await {
            Ok(prep) => {
                println!("✓ OC preparada exitosamente desde PostgreSQL");
                return Ok(prep);
            }
            Err(e) => {
                eprintln!("⚠️ Error PostgreSQL al preparar OC: {}", e);
            }
        }
    }

    match preparar_nueva_oc_sqlite(&pools.sqlite, &expediente_id).await {
        Ok(prep) => {
            println!("✓ OC preparada exitosamente desde SQLite");
            Ok(prep)
        }
        Err(e) => {
            let error_msg = format!("Error de base de datos: {}", e);
            eprintln!("✗ Error SQLite al preparar OC: {}", error_msg);
            Err(error_msg)
        }
    }
}

async fn preparar_nueva_oc_postgres(pool: &PgPool, expediente_id: &str) -> Result<NuevaOCPreparada, sqlx::Error> {
    let expediente = sqlx::query_as::<_, ExpedienteOCData>(
        r#"
        SELECT id::text, numero, año, asunto, nro_infogov, nro_gde, caratula, resolucion_nro,
               oc_señor, oc_domicilio, oc_cuit, oc_descripcion_zona, oc_forma_pago, oc_plazo_entrega
        FROM expedientes
        WHERE id = $1::uuid
        "#
    )
    .bind(expediente_id)
    .fetch_one(pool)
    .await?;

    let topes = get_topes_postgres(pool).await?;

    let año_actual = chrono::Utc::now().year();
    let ultima_oc: Option<String> = sqlx::query_scalar(
        "SELECT numero_oc FROM ordenes_compra WHERE fecha >= $1 ORDER BY fecha DESC, pedido_nro DESC LIMIT 1"
    )
    .bind(format!("{}-01-01", año_actual))
    .fetch_optional(pool)
    .await?;

    let numero_oc = generar_numero_oc(ultima_oc, año_actual);

    let pedido_nro: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(pedido_nro), 0) + 1 FROM ordenes_compra WHERE fecha >= $1"
    )
    .bind(format!("{}-01-01", año_actual))
    .fetch_one(pool)
    .await?;

    let subtotal = 0.0;
    let iva = 0.0;
    let total = 0.0;
    let tipo_contratacion = determinar_tipo_contratacion(total, &topes);
    let total_en_letras = monto_a_letras(total);

    Ok(NuevaOCPreparada {
        expediente: expediente.clone(),
        numero_oc,
        pedido_nro,
        fecha: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        destino: expediente.oc_descripcion_zona.clone().unwrap_or_else(|| "ZONA RIEGO MALARGUE".to_string()),
        forma_pago: expediente.oc_forma_pago.clone().unwrap_or_else(|| "Transferencia".to_string()),
        plazo_entrega: expediente.oc_plazo_entrega.clone().unwrap_or_else(|| "-".to_string()),
        es_iva_inscripto: true,
        tipo_contratacion,
        subtotal,
        iva,
        total,
        total_en_letras,
    })
}

async fn preparar_nueva_oc_sqlite(pool: &SqlitePool, expediente_id: &str) -> Result<NuevaOCPreparada, sqlx::Error> {
    let expediente = sqlx::query_as::<_, ExpedienteOCData>(
        r#"
        SELECT id, numero, año, asunto, nro_infogov, nro_gde, caratula, resolucion_nro,
               oc_señor, oc_domicilio, oc_cuit, oc_descripcion_zona, oc_forma_pago, oc_plazo_entrega
        FROM expedientes
        WHERE id = ?
        "#
    )
    .bind(expediente_id)
    .fetch_one(pool)
    .await?;

    let topes = get_topes_sqlite(pool).await?;

    let año_actual = chrono::Utc::now().year();
    let ultima_oc: Option<String> = sqlx::query_scalar(
        "SELECT numero_oc FROM ordenes_compra WHERE fecha >= ? ORDER BY fecha DESC, pedido_nro DESC LIMIT 1"
    )
    .bind(format!("{}-01-01", año_actual))
    .fetch_optional(pool)
    .await?;

    let numero_oc = generar_numero_oc(ultima_oc, año_actual);

    let pedido_nro: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(pedido_nro), 0) + 1 FROM ordenes_compra WHERE fecha >= ?"
    )
    .bind(format!("{}-01-01", año_actual))
    .fetch_one(pool)
    .await?;

    let subtotal = 0.0;
    let iva = 0.0;
    let total = 0.0;
    let tipo_contratacion = determinar_tipo_contratacion(total, &topes);
    let total_en_letras = monto_a_letras(total);

    Ok(NuevaOCPreparada {
        expediente: expediente.clone(),
        numero_oc,
        pedido_nro,
        fecha: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        destino: expediente.oc_descripcion_zona.clone().unwrap_or_else(|| "ZONA RIEGO MALARGUE".to_string()),
        forma_pago: expediente.oc_forma_pago.clone().unwrap_or_else(|| "Transferencia".to_string()),
        plazo_entrega: expediente.oc_plazo_entrega.clone().unwrap_or_else(|| "-".to_string()),
        es_iva_inscripto: true,
        tipo_contratacion,
        subtotal,
        iva,
        total,
        total_en_letras,
    })
}

/// Crear una nueva Orden de Compra (con transacción)
#[tauri::command]
pub async fn crear_orden_compra(
    pools: tauri::State<'_, DatabasePool>,
    data: CreateOrdenCompra,
) -> Result<OrdenCompraCompleta, String> {
    if let Some(pg_pool) = &pools.postgres {
        match create_oc_postgres(pg_pool, data.clone()).await {
            Ok(oc) => return Ok(oc),
            Err(e) => eprintln!("⚠️ Error PostgreSQL: {}", e),
        }
    }

    create_oc_sqlite(&pools.sqlite, data)
        .await
        .map_err(|e| e.to_string())
}

async fn create_oc_postgres(pool: &PgPool, data: CreateOrdenCompra) -> Result<OrdenCompraCompleta, sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Obtener topes
    let topes = sqlx::query_as::<_, ConfigTope>(
        "SELECT id, tipo_contratacion, monto_maximo::float8 as monto_maximo FROM config_topes"
    )
    .fetch_all(&mut *tx)
    .await?;

    // Calcular totales
    let (subtotal, iva, total) = calcular_totales(&data.renglones, data.es_iva_inscripto);
    let tipo_contratacion = determinar_tipo_contratacion(total, &topes);
    let total_en_letras = monto_a_letras(total);

    // Obtener última OC del año actual
    let año_actual = chrono::Utc::now().year();
    let ultima_oc: Option<String> = sqlx::query_scalar(
        "SELECT numero_oc FROM ordenes_compra WHERE fecha >= $1 ORDER BY fecha DESC, pedido_nro DESC LIMIT 1"
    )
    .bind(format!("{}-01-01", año_actual))
    .fetch_optional(&mut *tx)
    .await?;

    let numero_oc = generar_numero_oc(ultima_oc, año_actual);
    let id = Uuid::new_v4().to_string();

    // Insertar orden
    let orden = sqlx::query_as::<_, OrdenCompra>(
        r#"
        INSERT INTO ordenes_compra (
            id, numero_oc, destino, expediente_id, resolucion_nro, 
            forma_pago, plazo_entrega, es_iva_inscripto, tipo_contratacion,
            subtotal, iva, total, fecha
        ) VALUES (
            $1::uuid, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE
        )
        RETURNING 
            id::text, numero_oc, pedido_nro, destino, fecha::text, 
            expediente_id::text, resolucion_nro, forma_pago, plazo_entrega, 
            es_iva_inscripto, tipo_contratacion, subtotal::float8, iva::float8, total::float8
        "#
    )
    .bind(&id)
    .bind(&numero_oc)
    .bind(data.destino.clone().unwrap_or_else(|| "ZONA RIEGO MALARGUE".to_string()))
    .bind(&data.expediente_id)
    .bind(&data.resolucion_nro)
    .bind(&data.forma_pago)
    .bind(data.plazo_entrega.clone().unwrap_or_else(|| "-".to_string()))
    .bind(data.es_iva_inscripto)
    .bind(&tipo_contratacion)
    .bind(subtotal)
    .bind(iva)
    .bind(total)
    .fetch_one(&mut *tx)
    .await?;

    // Insertar renglones
    let mut renglones = Vec::new();
    for (idx, renglon_data) in data.renglones.iter().enumerate() {
        let renglon_id = Uuid::new_v4().to_string();
        let renglon = sqlx::query_as::<_, OrdenCompraRenglon>(
            r#"
            INSERT INTO orden_compra_renglones (
                id, oc_id, renglon_nro, cantidad, detalle, marca, valor_unitario
            ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)
            RETURNING id::text, oc_id::text, renglon_nro, cantidad::float8, detalle, marca, valor_unitario::float8
            "#
        )
        .bind(&renglon_id)
        .bind(&id)
        .bind((idx + 1) as i32)
        .bind(renglon_data.cantidad)
        .bind(&renglon_data.detalle)
        .bind(&renglon_data.marca)
        .bind(renglon_data.valor_unitario)
        .fetch_one(&mut *tx)
        .await?;
        
        renglones.push(renglon);
    }

    tx.commit().await?;

    Ok(OrdenCompraCompleta {
        orden,
        renglones,
        total_en_letras,
    })
}

async fn create_oc_sqlite(pool: &SqlitePool, data: CreateOrdenCompra) -> Result<OrdenCompraCompleta, sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Obtener topes
    let topes = sqlx::query_as::<_, ConfigTope>(
        "SELECT id, tipo_contratacion, monto_maximo FROM config_topes"
    )
    .fetch_all(&mut *tx)
    .await?;

    // Calcular totales
    let (subtotal, iva, total) = calcular_totales(&data.renglones, data.es_iva_inscripto);
    let tipo_contratacion = determinar_tipo_contratacion(total, &topes);
    let total_en_letras = monto_a_letras(total);

    // Obtener última OC del año actual
    let año_actual = chrono::Utc::now().year();
    let ultima_oc: Option<String> = sqlx::query_scalar(
        "SELECT numero_oc FROM ordenes_compra WHERE fecha >= ? ORDER BY fecha DESC, pedido_nro DESC LIMIT 1"
    )
    .bind(format!("{}-01-01", año_actual))
    .fetch_optional(&mut *tx)
    .await?;

    let numero_oc = generar_numero_oc(ultima_oc, año_actual);
    let id = Uuid::new_v4().to_string();
    let fecha = chrono::Utc::now().format("%Y-%m-%d").to_string();

    // Obtener siguiente pedido_nro
    let pedido_nro: i32 = sqlx::query_scalar("SELECT COALESCE(MAX(pedido_nro), 0) + 1 FROM ordenes_compra")
        .fetch_one(&mut *tx)
        .await?;

    // Insertar orden
    sqlx::query(
        r#"
        INSERT INTO ordenes_compra (
            id, numero_oc, pedido_nro, destino, fecha, expediente_id, resolucion_nro, 
            forma_pago, plazo_entrega, es_iva_inscripto, tipo_contratacion,
            subtotal, iva, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&numero_oc)
    .bind(pedido_nro)
    .bind(data.destino.clone().unwrap_or_else(|| "ZONA RIEGO MALARGUE".to_string()))
    .bind(&fecha)
    .bind(&data.expediente_id)
    .bind(&data.resolucion_nro)
    .bind(&data.forma_pago)
    .bind(data.plazo_entrega.clone().unwrap_or_else(|| "-".to_string()))
    .bind(data.es_iva_inscripto as i32)
    .bind(&tipo_contratacion)
    .bind(subtotal)
    .bind(iva)
    .bind(total)
    .execute(&mut *tx)
    .await?;

    let orden = OrdenCompra {
        id: id.clone(),
        numero_oc,
        pedido_nro,
        destino: data.destino.unwrap_or_else(|| "ZONA RIEGO MALARGUE".to_string()),
        fecha,
        expediente_id: data.expediente_id.clone(),
        resolucion_nro: data.resolucion_nro.clone(),
        forma_pago: data.forma_pago.clone(),
        plazo_entrega: data.plazo_entrega.unwrap_or_else(|| "-".to_string()),
        es_iva_inscripto: data.es_iva_inscripto,
        tipo_contratacion,
        subtotal,
        iva,
        total,
    };

    // Insertar renglones
    let mut renglones = Vec::new();
    for (idx, renglon_data) in data.renglones.iter().enumerate() {
        let renglon_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO orden_compra_renglones (id, oc_id, renglon_nro, cantidad, detalle, marca, valor_unitario) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&renglon_id)
        .bind(&id)
        .bind((idx + 1) as i32)
        .bind(renglon_data.cantidad)
        .bind(&renglon_data.detalle)
        .bind(&renglon_data.marca)
        .bind(renglon_data.valor_unitario)
        .execute(&mut *tx)
        .await?;

        renglones.push(OrdenCompraRenglon {
            id: renglon_id,
            oc_id: id.clone(),
            renglon_nro: (idx + 1) as i32,
            cantidad: renglon_data.cantidad,
            detalle: renglon_data.detalle.clone(),
            marca: renglon_data.marca.clone(),
            valor_unitario: renglon_data.valor_unitario,
        });
    }

    tx.commit().await?;

    Ok(OrdenCompraCompleta {
        orden,
        renglones,
        total_en_letras,
    })
}

/// Obtener todas las órdenes de compra
#[tauri::command]
pub async fn obtener_ordenes_compra(
    pools: tauri::State<'_, DatabasePool>,
) -> Result<Vec<OrdenCompra>, String> {
    if let Some(pg_pool) = &pools.postgres {
        match get_oc_postgres(pg_pool).await {
            Ok(ordenes) => return Ok(ordenes),
            Err(e) => eprintln!("⚠️ Error PostgreSQL: {}", e),
        }
    }

    get_oc_sqlite(&pools.sqlite)
        .await
        .map_err(|e| e.to_string())
}

async fn get_oc_postgres(pool: &PgPool) -> Result<Vec<OrdenCompra>, sqlx::Error> {
    let ordenes = sqlx::query_as::<_, OrdenCompra>(
        r#"
        SELECT 
            id::text, numero_oc, pedido_nro, destino, fecha::text, 
            expediente_id::text, resolucion_nro, forma_pago, plazo_entrega, 
            es_iva_inscripto, tipo_contratacion, subtotal::float8, iva::float8, total::float8
        FROM ordenes_compra 
        ORDER BY fecha DESC, pedido_nro DESC
        "#
    )
    .fetch_all(pool)
    .await?;
    Ok(ordenes)
}

async fn get_oc_sqlite(pool: &SqlitePool) -> Result<Vec<OrdenCompra>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, numero_oc, pedido_nro, destino, fecha, expediente_id, resolucion_nro, forma_pago, plazo_entrega, es_iva_inscripto, tipo_contratacion, subtotal, iva, total FROM ordenes_compra ORDER BY fecha DESC, pedido_nro DESC"
    )
    .fetch_all(pool)
    .await?;

    let ordenes = rows.into_iter().map(|row| {
        OrdenCompra {
            id: row.get("id"),
            numero_oc: row.get("numero_oc"),
            pedido_nro: row.get("pedido_nro"),
            destino: row.get("destino"),
            fecha: row.get("fecha"),
            expediente_id: row.get("expediente_id"),
            resolucion_nro: row.get("resolucion_nro"),
            forma_pago: row.get("forma_pago"),
            plazo_entrega: row.get("plazo_entrega"),
            es_iva_inscripto: row.get::<i32, _>("es_iva_inscripto") == 1,
            tipo_contratacion: row.get("tipo_contratacion"),
            subtotal: row.get("subtotal"),
            iva: row.get("iva"),
            total: row.get("total"),
        }
    }).collect();

    Ok(ordenes)
}

/// Generar PDF de Orden de Compra
#[derive(serde::Deserialize)]
pub struct GenerarPDFOCRequest {
    pub numero_oc: String,
    pub pedido_nro: i32,
    pub destino: String,
    pub fecha: String,
    pub expediente_numero: String,
    pub expediente_año: i32,
    pub nro_gde: Option<String>,
    pub nro_infogov: Option<String>,
    pub resolucion_nro: Option<String>,
    pub tipo_contratacion: String,
    pub señor: String,
    pub domicilio: String,
    pub cuit: String,
    pub descripcion_zona: String,
    pub renglones: Vec<PDFRenglon>,
    pub subtotal: f64,
    pub iva: f64,
    pub total: f64,
    pub total_en_letras: String,
    pub forma_pago: String,
    pub plazo_entrega: String,
    pub es_iva_inscripto: bool,
}

#[derive(serde::Deserialize)]
pub struct PDFRenglon {
    pub numero: usize,
    pub cantidad: f64,
    pub concepto: String,
    pub marca: Option<String>,
    pub valor_unitario: f64,
    pub total: f64,
}

#[tauri::command]
pub async fn generar_pdf(data: GenerarPDFOCRequest) -> Result<String, String> {
    println!("📄 Generando PDF para OC {}", data.numero_oc);
    
    // Obtener ruta de la plantilla Excel
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Error al obtener directorio ejecutable: {}", e))?;
    let exe_parent = exe_dir.parent()
        .ok_or("No se pudo obtener directorio padre del ejecutable")?;
    
    // Buscar plantilla en resources
    let template_path = exe_parent.join("resources/templates/MODELO_ORDEN_DE_COMPRA.xlsx");
    
    if !template_path.exists() {
        return Err(format!("Plantilla Excel no encontrada en: {:?}", template_path));
    }
    
    // Construir rutas de salida
    let home_dir = dirs::home_dir()
        .ok_or("No se pudo obtener el directorio home")?;
    let docs_dir = home_dir.join("Documents");
    std::fs::create_dir_all(&docs_dir)
        .map_err(|e| format!("Error al crear directorio: {}", e))?;
    
    let safe_oc_number = data.numero_oc.replace("/", "-");
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Error al obtener timestamp: {}", e))?
        .as_secs();
    let excel_filename = format!("OC-{}-temp-{}.xlsx", safe_oc_number, timestamp);
    let pdf_filename = format!("OC-{}-{}.pdf", safe_oc_number, timestamp);
    
    let temp_excel_path = docs_dir.join(&excel_filename);
    let pdf_path = docs_dir.join(&pdf_filename);
    
    // Crear datos Excel
    let destino_limpio = data.destino
        .replace("Zona Riego", "")
        .replace("ZONA RIEGO", "")
        .trim()
        .to_string();
    
    // Formatear fecha de ISO (2026-02-11) a español (11 de febrero de 2026)
    let fecha_formateada = formatear_fecha_español(&data.fecha)
        .unwrap_or_else(|_| data.fecha.clone());
    
    // Formatear expediente completo con GDE/InfoGov si existe
    let expediente_completo = formatear_expediente_completo(
        &data.expediente_numero, 
        data.expediente_año,
        data.nro_gde.as_deref(),
        data.nro_infogov.as_deref()
    );
    
    let excel_data = OCExcelData {
        numero_oc: data.numero_oc.clone(),
        pedido_nro: data.pedido_nro,
        destino: destino_limpio,
        fecha: fecha_formateada,
        expediente_numero: expediente_completo,
        expediente_año: data.expediente_año,
        resolucion_nro: data.resolucion_nro.clone(),
        tipo_contratacion: data.tipo_contratacion.clone(),
        señor: data.señor.clone(),
        domicilio: data.domicilio.clone(),
        cuit: data.cuit.clone(),
        descripcion_zona: data.descripcion_zona.clone(),
        renglones: data.renglones.iter().map(|r| OCRenglon {
            numero: r.numero,
            cantidad: r.cantidad,
            concepto: r.concepto.clone(),
            marca: r.marca.clone(),
            valor_unitario: r.valor_unitario,
            total: r.total,
        }).collect(),
        subtotal: data.subtotal,
        iva: data.iva,
        total: data.total,
        total_en_letras: data.total_en_letras.clone(),
        forma_pago: data.forma_pago.clone(),
        plazo_entrega: data.plazo_entrega.clone(),
        es_iva_inscripto: data.es_iva_inscripto,
    };
    
    // Copiar plantilla sin modificar
    std::fs::copy(&template_path, &temp_excel_path)
        .map_err(|e| format!("Error al copiar plantilla: {}", e))?;
    
    println!("✓ Plantilla copiada: {:?}", temp_excel_path);
    
    // Convertir Excel a PDF usando PowerShell (que también escribirá los datos)
    ejecutar_conversion_excel_a_pdf_con_datos(
        temp_excel_path.to_str().ok_or("Ruta de Excel inválida")?,
        pdf_path.to_str().ok_or("Ruta de PDF inválida")?,
        excel_data,
    )
    .map_err(|e| format!("Error al convertir a PDF: {}", e))?;

    let mut final_pdf_path = pdf_path.clone();
    let mut found = false;
    for _ in 0..10 {
        if final_pdf_path.exists() {
            found = true;
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    if !found {
        if let Some(stem) = pdf_path.file_stem().and_then(|s| s.to_str()) {
            let prefix = match stem.rsplit_once('-') {
                Some((base, _)) => format!("{}-", base),
                None => stem.to_string(),
            };
            let mut candidates: Vec<(std::path::PathBuf, std::time::SystemTime)> = Vec::new();
            if let Ok(entries) = std::fs::read_dir(&docs_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|e| e.to_str()).map(|e| e.eq_ignore_ascii_case("pdf")).unwrap_or(false) {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            if name.starts_with(&prefix) {
                                if let Ok(modified) = entry.metadata().and_then(|m| m.modified()) {
                                    candidates.push((path, modified));
                                }
                            }
                        }
                    }
                }
            }

            if let Some((path, _)) = candidates.into_iter().max_by_key(|(_, m)| *m) {
                final_pdf_path = path;
                found = true;
            }
        }
    }

    if !found {
        return Err("El PDF no fue generado correctamente".to_string());
    }

    println!("✓ PDF generado exitosamente en: {:?}", final_pdf_path);

    let path_str = final_pdf_path.to_str()
        .ok_or("No se pudo convertir la ruta a string")?
        .to_string();

    println!("✓ PDF generado exitosamente en: {}", path_str);
    Ok(path_str)
}

/// Formatear fecha de ISO (2026-02-11) a español (11 de febrero de 2026)
fn formatear_fecha_español(fecha_iso: &str) -> Result<String, String> {
    let fecha = NaiveDate::parse_from_str(fecha_iso, "%Y-%m-%d")
        .map_err(|e| format!("Error al parsear fecha: {}", e))?;
    
    let meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    let mes = meses.get(fecha.month0() as usize)
        .ok_or("Mes inválido")?;
    
    Ok(format!("Mendoza, {} de {} de {}", fecha.day(), mes, fecha.year()))
}

/// Formatear expediente completo: numero-?-año (nro_gde o nro_infogov)
fn formatear_expediente_completo(
    numero: &str, 
    año: i32, 
    nro_gde: Option<&str>, 
    nro_infogov: Option<&str>
) -> String {
    // Formato base: numero-?-año
    let formato_base = format!("{}-?-{}", numero, año % 100); // año en 2 dígitos
    
    // Si hay GDE o InfoGov, agregarlo
    if let Some(gde) = nro_gde {
        format!("{} ({})", formato_base, gde)
    } else if let Some(infogov) = nro_infogov {
        format!("{} ({})", formato_base, infogov)
    } else {
        formato_base
    }
}

