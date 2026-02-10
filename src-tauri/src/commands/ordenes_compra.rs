// Comandos Tauri para Órdenes de Compra
use crate::db::DatabasePool;
use crate::models::orden_compra::*;
use chrono::Datelike;
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
