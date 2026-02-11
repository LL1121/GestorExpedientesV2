use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

pub struct OCPDFData {
    pub numero_oc: String,
    pub pedido_nro: i32,
    pub destino: String,
    pub fecha: String,
    pub expediente_numero: String,
    pub expediente_año: i32,
    pub resolucion_nro: Option<String>,
    pub tipo_contratacion: String,
    pub señor: String,
    pub domicilio: String,
    pub cuit: String,
    pub descripcion_zona: String,
    pub renglones: Vec<OCRenglon>,
    pub subtotal: f64,
    pub iva: f64,
    pub total: f64,
    pub total_en_letras: String,
    pub forma_pago: String,
    pub plazo_entrega: String,
    pub es_iva_inscripto: bool,
}

pub struct OCRenglon {
    pub numero: usize,
    pub cantidad: f64,
    pub concepto: String,
    pub marca: Option<String>,
    pub valor_unitario: f64,
    pub total: f64,
}

pub fn generar_pdf_oc(data: OCPDFData, output_path: &str) -> Result<(), String> {
    let (document, page1, layer1) = PdfDocument::new("Orden de Compra", Mm(210.0), Mm(297.0), "Layer 1");
    
    let font = document
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| format!("Error al cargar fuente: {}", e))?;
    
    let font_bold = document
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| format!("Error al cargar fuente bold: {}", e))?;
    
    let current_layer = document.get_page(page1).get_layer(layer1);
    
    // ==== ENCABEZADO ====
    // Logo IRRIGACIÓN (izquierda)
    current_layer.use_text("IRRIGACIÓN", 28.0, Mm(15.0), Mm(280.0), &font_bold);
    
    // ORIGINAL (derecha)
    current_layer.use_text("ORIGINAL", 14.0, Mm(165.0), Mm(280.0), &font_bold);
    
    // Recuadro institución (centro)
    current_layer.use_text("DEPARTAMENTO GENERAL DE IRRIGACIÓN", 9.0, Mm(60.0), Mm(277.0), &font_bold);
    current_layer.use_text("C.U.I.T. 30-9991963-1", 9.0, Mm(60.0), Mm(273.5), &font_bold);
    
    // Datos OC a la derecha
    current_layer.use_text(&format!("ORDEN DE COMPRA N°: {}", data.numero_oc), 9.0, Mm(140.0), Mm(279.0), &font);
    current_layer.use_text(&format!("PEDIDO N°: {} / NRO.", data.pedido_nro), 9.0, Mm(140.0), Mm(275.0), &font);
    current_layer.use_text(&format!("DESTINO: {}", data.destino), 9.0, Mm(140.0), Mm(271.0), &font);
    current_layer.use_text(&format!("Mendoza, {}", data.fecha), 9.0, Mm(140.0), Mm(267.0), &font);
    
    // ==== DATOS DEL EXPEDIENTE ====
    let mut y = 260.0;
    current_layer.use_text(
        &format!("Expte. N°: {} ({}-{})", data.expediente_numero, data.expediente_año, data.expediente_año),
        8.5,
        Mm(15.0),
        Mm(y),
        &font,
    );
    y -= 3.5;
    current_layer.use_text(
        &format!("Resolución interna N°: {}", data.resolucion_nro.unwrap_or_default()),
        8.5,
        Mm(15.0),
        Mm(y),
        &font,
    );
    y -= 3.5;
    current_layer.use_text(
        &format!("Tipo de Contratación: {}", data.tipo_contratacion),
        8.5,
        Mm(15.0),
        Mm(y),
        &font,
    );
    
    // ==== DATOS DEL PROVEEDOR ====
    y -= 8.0;
    current_layer.use_text("SEÑORES:", 8.5, Mm(15.0), Mm(y), &font_bold);
    current_layer.use_text(&data.señor, 8.5, Mm(45.0), Mm(y), &font);
    
    y -= 3.5;
    current_layer.use_text("DOMICILIO:", 8.5, Mm(15.0), Mm(y), &font_bold);
    current_layer.use_text(&data.domicilio, 8.5, Mm(45.0), Mm(y), &font);
    
    y -= 3.5;
    current_layer.use_text("CUIT:", 8.5, Mm(15.0), Mm(y), &font_bold);
    current_layer.use_text(&data.cuit, 8.5, Mm(45.0), Mm(y), &font);
    
    // ==== NOTAS ====
    y -= 6.0;
    current_layer.use_text(
        "De acuerdo con la propuesta presentada por ustedes y las reservas consignadas en la presente Orden de Compra, sírvase proveer por cuenta de este Departamento General de Irrigación los artículos que abajo se detallan. Con nuestras más cordiales saludos.",
        7.0,
        Mm(15.0),
        Mm(y),
        &font,
    );
    
    // ==== ZONA ====
    y -= 8.0;
    current_layer.use_text(
        &format!("ZONA: {}", data.descripcion_zona),
        8.5,
        Mm(15.0),
        Mm(y),
        &font_bold,
    );
    
    y -= 6.0;
    current_layer.use_text(
        "Esta firma deberá presentar la Factura original no 'B' o 'C' según corresponda en la oficina de ZONA RIEGO MALARGUE, sito en Avda. San Martín 258 - Malargüe - Mendoza, acompañada del Remito y esta Orden de Compra. Sólo se considerada haberse iniciado el IMPULSO DE SELLOS correspondiente según lo establecido por la legislación vigente. En caso de estar EXENTO en el pago de dicho impuesto, deberá adjuntar la inspectora constancia de exención, debidamente actualizada. Esta documentación y los pagos inspecciones quedarán sujetos a lo establecido en el Reglamento de Compras.",
        6.5,
        Mm(15.0),
        Mm(y),
        &font,
    );
    
    // ==== TABLA DE RENGLONES ====
    y -= 12.0;
    
    // Encabezados de tabla
    let table_y = y;
    current_layer.use_text("Renglón Nro.", 8.0, Mm(17.0), Mm(table_y), &font_bold);
    current_layer.use_text("Cantidad", 8.0, Mm(37.0), Mm(table_y), &font_bold);
    current_layer.use_text("CONCEPTO / DETALLE", 8.0, Mm(55.0), Mm(table_y), &font_bold);
    current_layer.use_text("Marca", 8.0, Mm(140.0), Mm(table_y), &font_bold);
    current_layer.use_text("Valor Unitario", 8.0, Mm(160.0), Mm(table_y), &font_bold);
    current_layer.use_text("Totales", 8.0, Mm(185.0), Mm(table_y), &font_bold);
    
    y -= 4.0;
    
    // Renglones
    for (idx, renglon) in data.renglones.iter().enumerate() {
        current_layer.use_text(&renglon.numero.to_string(), 7.5, Mm(17.0), Mm(y), &font);
        current_layer.use_text(&format!("{:.2}", renglon.cantidad), 7.5, Mm(37.0), Mm(y), &font);
        current_layer.use_text(&renglon.concepto, 6.5, Mm(55.0), Mm(y), &font);
        current_layer.use_text(
            &renglon.marca.clone().unwrap_or_else(|| "-".to_string()),
            7.5,
            Mm(140.0),
            Mm(y),
            &font,
        );
        current_layer.use_text(&format!("$ {:.2}", renglon.valor_unitario), 7.5, Mm(160.0), Mm(y), &font);
        current_layer.use_text(&format!("$ {:.2}", renglon.total), 7.5, Mm(185.0), Mm(y), &font);
        
        y -= 4.0;
        if idx < data.renglones.len() - 1 {
            y -= 1.0;
        }
    }
    
    // Total de tabla
    y -= 2.0;
    current_layer.use_text("TOTAL:", 8.5, Mm(160.0), Mm(y), &font_bold);
    current_layer.use_text(&format!("$ {:.2}", data.total), 8.5, Mm(185.0), Mm(y), &font_bold);
    
    // ==== RESUMEN ====
    y -= 7.0;
    current_layer.use_text("Son Pesos:", 8.0, Mm(15.0), Mm(y), &font_bold);
    current_layer.use_text(&data.total_en_letras, 8.0, Mm(45.0), Mm(y), &font);
    
    y -= 4.0;
    current_layer.use_text("Forma de Pago:", 8.0, Mm(15.0), Mm(y), &font_bold);
    current_layer.use_text(&data.forma_pago, 8.0, Mm(45.0), Mm(y), &font);
    
    y -= 4.0;
    current_layer.use_text("Plazo de Entrega:", 8.0, Mm(15.0), Mm(y), &font_bold);
    current_layer.use_text(&data.plazo_entrega, 8.0, Mm(45.0), Mm(y), &font);
    
    // ==== NOTA ====
    y -= 6.0;
    current_layer.use_text(
        "* Se deberá adjuntar con la factura, la Orden de Compra Original sellada y Copia de Ingresos Varios",
        7.0,
        Mm(15.0),
        Mm(y),
        &font,
    );
    
    // ==== TABLA IVA ====
    y -= 8.0;
    current_layer.use_text("IVA RESPONSABLE INSCRIPTO", 9.0, Mm(70.0), Mm(y), &font_bold);
    
    y -= 5.0;
    current_layer.use_text("Importe Neto Gravado", 7.5, Mm(80.0), Mm(y), &font);
    current_layer.use_text(&format!("$ {:.2}", data.subtotal), 7.5, Mm(185.0), Mm(y), &font);
    
    y -= 4.0;
    let iva_pct = if data.es_iva_inscripto { "21%" } else { "10.50%" };
    current_layer.use_text(&format!("IVA {} / 10.50%", iva_pct), 7.5, Mm(80.0), Mm(y), &font);
    current_layer.use_text(&format!("$ {:.2}", data.iva), 7.5, Mm(185.0), Mm(y), &font);
    
    y -= 4.0;
    current_layer.use_text("TOTAL", 8.0, Mm(80.0), Mm(y), &font_bold);
    current_layer.use_text(&format!("$ {:.2}", data.total), 8.0, Mm(185.0), Mm(y), &font_bold);
    
    document
        .save(&mut BufWriter::new(
            File::create(output_path).map_err(|e| format!("Error al crear archivo: {}", e))?
        ))
        .map_err(|e| format!("Error al guardar PDF: {}", e))?;
    
    Ok(())
}
