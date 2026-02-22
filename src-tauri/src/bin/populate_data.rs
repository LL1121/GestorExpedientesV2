use chrono::{Utc, Duration};
use sqlx::sqlite::SqlitePool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Conectar a la base de datos
    let database_url = "../app.db";
    let pool = SqlitePool::connect(&format!("sqlite:{}", database_url)).await?;

    println!("📦 Poblando base de datos con datos de prueba...");

    // Limpiar expedientes existentes
    sqlx::query("DELETE FROM expedientes").execute(&pool).await?;
    println!("🗑️  Tabla limpiada");

    let hoy = Utc::now();
    let hace_5_dias = hoy - Duration::days(5);
    let hace_3_dias = hoy - Duration::days(3);
    let hace_12_dias = hoy - Duration::days(12);
    let hace_21_dias = hoy - Duration::days(21);
    let hace_18_dias = hoy - Duration::days(18);
    let en_2_dias = hoy + Duration::days(2);
    let en_3_dias = hoy + Duration::days(3);
    let en_5_dias = hoy + Duration::days(5);
    let en_7_dias = hoy + Duration::days(7);

    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_infogov, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("11111111-1111-1111-1111-111111111111")
    .bind("EXP-001")
    .bind(2026)
    .bind("INFOGOV")
    .bind("Solicitud de compra de materiales")
    .bind("Material para obras")
    .bind("Obras")
    .bind("ALTA")
    .bind(hace_21_dias)
    .bind(hace_5_dias)
    .bind("Construcción")
    .bind("2024-001-456")
    .bind("Materiales")
    .bind("ENPROCESO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-001 (Vencido)");

    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("22222222-2222-2222-2222-222222222222")
    .bind("EXP-002")
    .bind(2026)
    .bind("INTERNO")
    .bind("Resolución de conflicto laboral")
    .bind("Mediación entre partes")
    .bind("Recursos Humanos")
    .bind("ALTA")
    .bind(hace_12_dias)
    .bind(hace_3_dias)
    .bind("RRHH")
    .bind("Conflicto Laboral")
    .bind("OBSERVADO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-002 (Vencido)");

    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_infogov, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("33333333-3333-3333-3333-333333333333")
    .bind("EXP-003")
    .bind(2026)
    .bind("INFOGOV")
    .bind("Autorización de gastos especiales")
    .bind("Gastos para conferencia")
    .bind("Administración")
    .bind("MEDIA")
    .bind(hace_21_dias)
    .bind(hace_12_dias)
    .bind("Gastos")
    .bind("2024-002-789")
    .bind("Gastos Especiales")
    .bind("ENPROCESO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-003 (Vencido)");

    // PRÓXIMOS A VENCER
    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_gde, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("44444444-4444-4444-4444-444444444444")
    .bind("EXP-004")
    .bind(2026)
    .bind("GDE")
    .bind("Trámite de licencia municipal")
    .bind("Renovación anual")
    .bind("Legal")
    .bind("ALTA")
    .bind(hace_12_dias)
    .bind(en_3_dias)
    .bind("Licencias")
    .bind("2026-GDE-123")
    .bind("Licencia")
    .bind("INICIADO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-004 (Próximo vencer)");

    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_infogov, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("55555555-5555-5555-5555-555555555555")
    .bind("EXP-005")
    .bind(2026)
    .bind("INFOGOV")
    .bind("Inspección de seguridad")
    .bind("Inspección anual")
    .bind("Seguridad")
    .bind("ALTA")
    .bind(hace_12_dias)
    .bind(en_2_dias)
    .bind("Seguridad")
    .bind("2024-003-123")
    .bind("Inspección")
    .bind("ENPROCESO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-005 (Próximo vencer)");

    // ÓRDENES DE COMPRA
    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, tema, estado, oc_señor, oc_domicilio, oc_cuit, oc_descripcion_zona, oc_forma_pago, oc_plazo_entrega, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("66666666-6666-6666-6666-666666666666")
    .bind("PAG-001")
    .bind(2026)
    .bind("PAGO")
    .bind("Orden de compra - Equipos informáticos")
    .bind("Laptops y periféricos")
    .bind("Compras")
    .bind("MEDIA")
    .bind(hace_12_dias)
    .bind(en_5_dias)
    .bind("Equipos")
    .bind("Equipamiento")
    .bind("ENPROCESO")
    .bind("Empresa XYZ")
    .bind("Calle Principal 123")
    .bind("20-12345678-9")
    .bind("Centro")
    .bind("Transferencia")
    .bind("15 días")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ PAG-001 (Sin pagar)");

    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, tema, estado, oc_señor, oc_domicilio, oc_cuit, oc_descripcion_zona, oc_forma_pago, oc_plazo_entrega, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("77777777-7777-7777-7777-777777777777")
    .bind("PAG-002")
    .bind(2026)
    .bind("PAGO")
    .bind("Factura por servicios profesionales")
    .bind("Asesoría legal")
    .bind("Legal")
    .bind("MEDIA")
    .bind(hace_21_dias)
    .bind(en_7_dias)
    .bind("Servicios")
    .bind("Asesoría")
    .bind("INICIADO")
    .bind("Estudio Jurídico ABC")
    .bind("Av. Reforma 456")
    .bind("23-98765432-1")
    .bind("Norte")
    .bind("Cheque")
    .bind("Inmediato")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ PAG-002 (Sin pagar)");

    // PENDIENTES
    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("88888888-8888-8888-8888-888888888888")
    .bind("EXP-009")
    .bind(2026)
    .bind("INTERNO")
    .bind("Evaluación de ofertas de proveedores")
    .bind("Análisis de ofertas")
    .bind("Compras")
    .bind("MEDIA")
    .bind(hace_21_dias)
    .bind(Option::<String>::None) // Sin fecha vencimiento
    .bind("Proveedores")
    .bind("Ofertas")
    .bind("INICIADO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-009 (Pendiente)");

    sqlx::query(
        r#"
        INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_infogov, tema, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind("99999999-9999-9999-9999-999999999999")
    .bind("EXP-010")
    .bind(2026)
    .bind("INFOGOV")
    .bind("Revisión de documentación técnica")
    .bind("Auditoría técnica")
    .bind("Sistemas")
    .bind("MEDIA")
    .bind(hace_18_dias)
    .bind(Option::<String>::None) // Sin fecha vencimiento
    .bind("Sistemas")
    .bind("2024-004-456")
    .bind("Auditoría")
    .bind("ENPROCESO")
    .bind(hoy)
    .bind(hoy)
    .execute(&pool)
    .await?;
    println!("✅ EXP-010 (Pendiente)");

    println!("\n🎉 ¡Datos de prueba insertados exitosamente!");
    println!("📊 Total: 9 expedientes");
    println!("   - 3 Vencidos");
    println!("   - 2 Próximos a vencer");
    println!("   - 2 Sin pagar (Órdenes de compra)");
    println!("   - 2 Pendientes");

    Ok(())
}
