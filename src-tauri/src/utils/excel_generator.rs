use std::fs;
use std::path::PathBuf;
use serde::Serialize;

pub struct OCExcelData {
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

#[derive(Serialize)]
pub struct OCRenglon {
    pub numero: usize,
    pub cantidad: f64,
    pub concepto: String,
    pub marca: Option<String>,
    pub valor_unitario: f64,
    pub total: f64,
}

pub fn generar_excel_oc(data: OCExcelData, template_path: &str, output_path: &str) -> Result<(), String> {
    println!("📋 Copiando plantilla: {} -> {}", template_path, output_path);
    
    // Copiar la plantilla al archivo de salida
    fs::copy(template_path, output_path)
        .map_err(|e| format!("Error al copiar plantilla Excel: {}", e))?;
    
    println!("📖 Leyendo Excel con umya-spreadsheet...");
    
    // Leer y modificar usando umya-spreadsheet
    let template_path_obj = std::path::Path::new(output_path);
    let mut book = umya_spreadsheet::reader::xlsx::read(template_path_obj)
        .map_err(|e| format!("Error al leer Excel: {:?}", e))?;
    
    println!("📊 Verificando hojas...");
    
    if book.get_sheet(0).is_err() {
        return Err("La plantilla Excel no contiene hojas".to_string());
    }
    let sheet = book.get_sheet_mut(0);
    
    println!("✏️ Inyectando datos en celdas...");
    
    // Inyectar datos en las celdas correctas usando la notación de coordenadas
    // Encabezado
    set_cell(sheet, 2, 7, &data.numero_oc);
    set_cell(sheet, 2, 8, &format!("{} / NRO.", data.pedido_nro));
    set_cell(sheet, 3, 7, &data.destino);
    set_cell(sheet, 4, 7, &data.fecha);
    
    // Expediente
    set_cell(sheet, 7, 3, &format!("{}-{}", data.expediente_numero, data.expediente_año));
    set_cell(sheet, 8, 3, &data.resolucion_nro.unwrap_or_default());
    set_cell(sheet, 9, 3, &data.tipo_contratacion);
    
    // Proveedor
    set_cell(sheet, 11, 5, &data.señor);
    set_cell(sheet, 12, 5, &data.domicilio);
    set_cell(sheet, 13, 5, &data.cuit);
    
    // Descripción de zona
    set_cell(sheet, 16, 3, &data.descripcion_zona);
    
    // Renglones (empiezan en fila 27)
    let mut current_row = 27;
    for renglon in &data.renglones {
        set_cell(sheet, current_row, 2, &renglon.numero.to_string());
        set_cell(sheet, current_row, 3, &format!("{:.2}", renglon.cantidad));
        set_cell(sheet, current_row, 4, &renglon.concepto);
        set_cell(sheet, current_row, 8, &renglon.marca.clone().unwrap_or_else(|| "-".to_string()));
        set_cell(sheet, current_row, 9, &format!("{:.2}", renglon.valor_unitario));
        set_cell(sheet, current_row, 10, &format!("{:.2}", renglon.total));
        
        current_row += 1;
    }
    
    // Totales
    let total_row = current_row + 2;
    set_cell(sheet, total_row, 9, &format!("{:.2}", data.total));
    
    // Son pesos
    set_cell(sheet, total_row + 2, 3, &data.total_en_letras);
    
    // Forma de pago y plazo
    set_cell(sheet, total_row + 2, 5, &data.forma_pago);
    set_cell(sheet, total_row + 3, 5, &data.plazo_entrega);
    
    // IVA
    let iva_row = total_row + 6;
    set_cell(sheet, iva_row, 9, &format!("{:.2}", data.subtotal));
    
    let iva_pct = if data.es_iva_inscripto { "21%" } else { "10.50%" };
    set_cell(sheet, iva_row + 1, 3, iva_pct);
    set_cell(sheet, iva_row + 1, 9, &format!("{:.2}", data.iva));
    
    set_cell(sheet, iva_row + 2, 9, &format!("{:.2}", data.total));
    
    println!("💾 Guardando Excel modificado...");
    
    // Guardar el archivo modificado
    let output_path_obj = std::path::Path::new(output_path);
    umya_spreadsheet::writer::xlsx::write(&book, output_path_obj)
        .map_err(|e| format!("Error al guardar Excel: {:?}", e))?;
    
    // Verificar que el archivo existe y tiene contenido
    let metadata = fs::metadata(output_path)
        .map_err(|e| format!("Error al verificar Excel generado: {}", e))?;
    
    println!("✅ Excel guardado correctamente ({} bytes)", metadata.len());
    
    if metadata.len() < 1000 {
        return Err(format!("El Excel generado es sospechosamente pequeño: {} bytes", metadata.len()));
    }
    
    Ok(())
}

fn set_cell(sheet: &mut umya_spreadsheet::Worksheet, row: u32, col: u32, value: &str) {
    let cell_ref = format!("{}{}", column_to_letter(col), row);
    let cell = sheet.get_cell_mut(cell_ref);
    cell.set_value(value);
}

fn column_to_letter(col: u32) -> String {
    let mut col = col;
    let mut result = String::new();
    
    while col > 0 {
        col -= 1;
        result.insert(0, (b'A' + (col % 26) as u8) as char);
        col /= 26;
    }
    
    result
}

pub fn crear_script_powershell(excel_path: &str, pdf_path: &str) -> Result<PathBuf, String> {
    let temp_dir = std::env::temp_dir();
    let script_path = temp_dir.join("convert_to_pdf.ps1");
    let log_path = temp_dir.join("convert_to_pdf.log");
    
    // Crear el script PowerShell que convierte Excel a PDF
    let script_content = format!(
        r#"$ErrorActionPreference = 'Stop'
$excelFile = "{}"
$pdfFile = "{}"
$logFile = "{}"

"[{{0}}] Inicio" -f (Get-Date) | Out-File -FilePath $logFile -Encoding UTF8
"Excel: $excelFile" | Out-File -FilePath $logFile -Append -Encoding UTF8
"PDF: $pdfFile" | Out-File -FilePath $logFile -Append -Encoding UTF8

try {{
    if (-Not (Test-Path $excelFile)) {{ throw "No existe el Excel temporal" }}
    
    $excelFileInfo = Get-Item $excelFile
    "Tamaño Excel: {{0}} bytes" -f $excelFileInfo.Length | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $pdfDir = Split-Path -Parent $pdfFile
    if (-Not (Test-Path $pdfDir)) {{ New-Item -ItemType Directory -Path $pdfDir | Out-Null }}

    $excel = New-Object -ComObject Excel.Application
    "Excel COM creado" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $fullPath = (Resolve-Path $excelFile).Path
    "Abriendo: $fullPath" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # Parámetros explícitos para Open
    $UpdateLinks = 0
    $ReadOnly = $false
    $Format = 5  # xlOpenXMLWorkbook
    $Password = [Type]::Missing
    $WriteResPassword = [Type]::Missing
    $IgnoreReadOnlyRecommended = $true
    $Origin = [Type]::Missing
    $Delimiter = [Type]::Missing
    $Editable = $false
    $Notify = $false
    $Converter = [Type]::Missing
    $AddToMru = $false
    $Local = $false
    $CorruptLoad = [Type]::Missing
    
    $workbook = $excel.Workbooks.Open(
        $fullPath,
        $UpdateLinks,
        $ReadOnly,
        $Format,
        $Password,
        $WriteResPassword,
        $IgnoreReadOnlyRecommended,
        $Origin,
        $Delimiter,
        $Editable,
        $Notify,
        $Converter,
        $AddToMru,
        $Local,
        $CorruptLoad
    )
    "Workbook abierto" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook.ExportAsFixedFormat(0, $pdfFile, 0, $true, $true)
    "PDF exportado" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook.Close($false)
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    Start-Sleep -Milliseconds 1500
    if (-Not (Test-Path $pdfFile)) {{
        throw "El PDF no fue generado correctamente"
    }}

    Remove-Item $excelFile -Force -ErrorAction SilentlyContinue
    "[{{0}}] OK" -f (Get-Date) | Out-File -FilePath $logFile -Append -Encoding UTF8
}} catch {{
    "[{{0}}] ERROR: {{1}}" -f (Get-Date), $_.Exception.Message | Out-File -FilePath $logFile -Append -Encoding UTF8
    "Exception Type: {{0}}" -f $_.Exception.GetType().FullName | Out-File -FilePath $logFile -Append -Encoding UTF8
    if ($excel) {{
        try {{ $excel.Quit() }} catch {{}}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }}
    Write-Error $_.Exception.Message
    exit 1
}}
"#,
        excel_path,
        pdf_path,
        log_path.to_string_lossy()
    );
    
    fs::write(&script_path, script_content)
        .map_err(|e| format!("Error al crear script PowerShell: {}", e))?;
    
    Ok(script_path)
}

pub fn ejecutar_conversion_excel_a_pdf_con_datos(excel_path: &str, pdf_path: &str, data: OCExcelData) -> Result<(), String> {
    use std::process::Command;
    
    let log_path = std::env::temp_dir().join("convert_to_pdf.log");
    let script_path = crear_script_powershell_con_datos(excel_path, pdf_path, data)?;
    
    // Ejecutar PowerShell de forma oculta
    let output = Command::new("powershell.exe")
        .arg("-NoProfile")
        .arg("-WindowStyle")
        .arg("Hidden")
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-File")
        .arg(script_path.to_str().ok_or("Ruta de script inválida")?)
        .output()
        .map_err(|e| format!("Error al ejecutar PowerShell: {}", e))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        let output_msg = String::from_utf8_lossy(&output.stdout);
        let log_details = if log_path.exists() {
            match fs::read_to_string(&log_path) {
                Ok(content) => format!("\nLog PowerShell:\n{}", content),
                Err(_) => "".to_string(),
            }
        } else {
            "".to_string()
        };
        return Err(format!("Error en PowerShell: {}{}{}", error_msg, output_msg, log_details));
    }

    let final_pdf_path = std::path::PathBuf::from(pdf_path);
    let mut found = false;
    for _ in 0..10 {
        if final_pdf_path.exists() {
            found = true;
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    if !found {
        return Err("El PDF no fue generado correctamente".to_string());
    }

    Ok(())
}

pub fn crear_script_powershell_con_datos(excel_path: &str, pdf_path: &str, data: OCExcelData) -> Result<PathBuf, String> {
    let temp_dir = std::env::temp_dir();
    let script_path = temp_dir.join("convert_to_pdf_with_data.ps1");
    let log_path = temp_dir.join("convert_to_pdf.log");
    
    // Crear JSON de renglones para PowerShell
    let mut renglones_ps = String::new();
    for (idx, r) in data.renglones.iter().enumerate() {
        renglones_ps.push_str(&format!(
            "@{{num={}; cant={}; detalle='{}'; marca='{}'; precio={}; total={}}},\n        ",
            idx + 1,
            r.cantidad,
            r.concepto.replace("'", "''"),
            r.marca.as_ref().unwrap_or(&"-".to_string()).replace("'", "''"),
            r.valor_unitario,
            r.total
        ));
    }
    renglones_ps = renglones_ps.trim_end_matches(",\n        ").to_string();
    
    let script_content = format!(
        r#"# Configurar codificación UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$ErrorActionPreference = 'Stop'
$excelFile = "{}"
$pdfFile = "{}"
$logFile = "{}"

"[{{0}}] Inicio" -f (Get-Date) | Out-File -FilePath $logFile -Encoding UTF8

try {{
    if (-Not (Test-Path $excelFile)) {{ throw "No existe el Excel temporal" }}
    
    $excel = New-Object -ComObject Excel.Application
    "Excel COM creado" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $fullPath = (Resolve-Path $excelFile).Path
    "Abriendo: $fullPath" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook = $excel.Workbooks.Open($fullPath)
    "Workbook abierto" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $sheet = $workbook.Worksheets.Item(1)
    "Sheet obtenido" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # CABECERA
    $sheet.Cells(2, 7) = "{}"  # G2: Solo el número
    $sheet.Cells(3, 7) = "{}"  # G3: Nro Pedido
    $sheet.Cells(4, 6) = "{}".ToUpper()  # F4: Destino en MAYÚSCULAS
    $sheet.Cells(4, 6).Font.Bold = $true  # F4: Negrita
    $sheet.Cells(6, 5) = "{}"  # E6: Fecha completa en español
    
    # DATOS ADMINISTRATIVOS
    $sheet.Cells(7, 1) = "Expte. Nº {}"  # A7: Expediente completo
    $sheet.Cells(8, 1) = "Resolución interna Nº {}"  # A8: Resolución
    $sheet.Cells(9, 1) = "{}"  # A9: Tipo Contratación (sin prefijo)
    
    # PROVEEDOR
    $sheet.Cells(11, 3) = "{}"  # C11: Señor (mayúsculas)
    $sheet.Cells(12, 3) = "{}"  # C12: Domicilio
    $sheet.Cells(13, 3) = "{}"  # C13: CUIT
    
    "Datos básicos escritos" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # RENGLONES (tabla comienza en fila 26)
    $renglones = @(
        {}
    )
    
    $numRenglones = $renglones.Count
    $firstRenglon = 26
    
    # Si hay más de 1 renglón, necesitamos copiar la fila template
    if ($numRenglones -gt 1) {{
        # Copiar la fila 26 (template) para cada renglón adicional
        for ($i = 1; $i -lt $numRenglones; $i++) {{
            $targetRow = $firstRenglon + $i
            # Copiar toda la fila 26 a la fila destino
            $sheet.Rows($firstRenglon).Copy() | Out-Null
            $sheet.Rows($targetRow).Insert(-4121) | Out-Null  # xlShiftDown = -4121
        }}
    }}
    
    # Normalizar bordes de todas las filas de renglones para que tengan el mismo grosor
    $lastRenglon = $firstRenglon + $numRenglones - 1
    for ($row = $firstRenglon; $row -le $lastRenglon; $row++) {{
        for ($col = 1; $col -le 6; $col++) {{
            $cell = $sheet.Cells($row, $col)
            # Aplicar bordes uniformes a TODOS los lados (Weight = 2 es fino/normal)
            $cell.Borders.Item(7).Weight = 2    # xlEdgeLeft
            $cell.Borders.Item(8).Weight = 2    # xlEdgeTop
            $cell.Borders.Item(9).Weight = 2    # xlEdgeBottom
            $cell.Borders.Item(10).Weight = 2   # xlEdgeRight
            $cell.Borders.Item(11).Weight = 2   # xlInsideVertical
            $cell.Borders.Item(12).Weight = 2   # xlInsideHorizontal
        }}
    }}
    
    # Normalizar bordes del rango completo de la tabla
    $tableRange = $sheet.Range($sheet.Cells($firstRenglon, 1), $sheet.Cells($lastRenglon, 6))
    $tableRange.Borders.Weight = 2  # Normalizar todos los bordes del rango
    
    $currentRow = 26
    foreach ($item in $renglones) {{
        $sheet.Cells($currentRow, 1) = $item.num          # A: Índice
        $sheet.Cells($currentRow, 2) = $item.cant         # B: Cantidad
        $sheet.Cells($currentRow, 3) = $item.detalle      # C: Detalle
        $sheet.Cells($currentRow, 3).WrapText = $true
        $sheet.Cells($currentRow, 4) = $item.marca        # D: Marca
        $sheet.Cells($currentRow, 5) = $item.precio       # E: Precio unitario
        # La celda F ya tiene la fórmula del template, solo actualizarla
        $fila = $currentRow
        $sheet.Cells($currentRow, 6).Formula = "=B$fila*E$fila"
        $currentRow++
    }}
    
    "Renglones escritos" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # TOTALES - Escribir en la fila después del último renglón
    $totalRow = 26 + $numRenglones
    $sheet.Cells($totalRow, 6) = {}  # Total numérico
    $sheet.Cells($totalRow + 2, 3) = "{}"  # Total en letras
    
    "Totales escritos" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook.ExportAsFixedFormat(0, $pdfFile)
    "PDF exportado" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook.Close($false)
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()

    if (-Not (Test-Path $pdfFile)) {{
        throw "El PDF no fue generado"
    }}

    Remove-Item $excelFile -Force -ErrorAction SilentlyContinue
    "[{{0}}] OK" -f (Get-Date) | Out-File -FilePath $logFile -Append -Encoding UTF8
}} catch {{
    "[{{0}}] ERROR: {{1}}" -f (Get-Date), $_.Exception.Message | Out-File -FilePath $logFile -Append -Encoding UTF8
    if ($excel) {{
        try {{ $excel.Quit() }} catch {{}}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }}
    Write-Error $_.Exception.Message
    exit 1
}}
"#,
        excel_path,
        pdf_path,
        log_path.to_string_lossy(),
        data.numero_oc.replace("\"", "\"\""),
        data.pedido_nro,
        data.destino.replace("\"", "\"\""),
        data.fecha.replace("\"", "\"\""),  // Fecha ya formateada en español desde el backend
        data.expediente_numero.replace("\"", "\"\""),  // Expediente ya formateado completo
        data.resolucion_nro.unwrap_or_else(|| "S/N".to_string()).replace("\"", "\"\""),
        data.tipo_contratacion.replace("\"", "\"\""),
        data.señor.to_uppercase().replace("\"", "\"\""),
        data.domicilio.replace("\"", "\"\""),
        data.cuit.replace("\"", "\"\""),
        renglones_ps,
        data.total,
        data.total_en_letras.replace("\"", "\"\"")
    );
    
    // Escribir script con UTF-8 BOM
    let script_bytes = format!("\u{FEFF}{}", script_content);
    fs::write(&script_path, script_bytes.as_bytes())
        .map_err(|e| format!("Error al crear script PowerShell: {}", e))?;
    
    Ok(script_path)
}

pub fn crear_script_powershell_excel_con_datos(excel_path: &str, data: OCExcelData) -> Result<PathBuf, String> {
    let temp_dir = std::env::temp_dir();
    let script_path = temp_dir.join("fill_excel_with_data.ps1");
    let log_path = temp_dir.join("fill_excel_with_data.log");
    
    // Crear JSON de renglones para PowerShell
    let mut renglones_ps = String::new();
    for (idx, r) in data.renglones.iter().enumerate() {
        renglones_ps.push_str(&format!(
            "@{{num={}; cant={}; detalle='{}'; marca='{}'; precio={}; total={}}},\n        ",
            idx + 1,
            r.cantidad,
            r.concepto.replace("'", "''"),
            r.marca.as_ref().unwrap_or(&"-".to_string()).replace("'", "''"),
            r.valor_unitario,
            r.total
        ));
    }
    renglones_ps = renglones_ps.trim_end_matches(",\n        ").to_string();

    let script_content = format!(
        r#"# Configurar codificación UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$ErrorActionPreference = 'Stop'
$excelFile = "{}"
$logFile = "{}"

"[{{0}}] Inicio" -f (Get-Date) | Out-File -FilePath $logFile -Encoding UTF8

try {{
    if (-Not (Test-Path $excelFile)) {{ throw "No existe el Excel temporal" }}
    
    $excel = New-Object -ComObject Excel.Application
    "Excel COM creado" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $fullPath = (Resolve-Path $excelFile).Path
    "Abriendo: $fullPath" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook = $excel.Workbooks.Open($fullPath)
    "Workbook abierto" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $sheet = $workbook.Worksheets.Item(1)
    "Sheet obtenido" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # CABECERA
    $sheet.Cells(2, 7) = "{}"  # G2: Solo el número
    $sheet.Cells(3, 7) = "{}"  # G3: Nro Pedido
    $sheet.Cells(4, 6) = "{}".ToUpper()  # F4: Destino en MAYÚSCULAS
    $sheet.Cells(4, 6).Font.Bold = $true  # F4: Negrita
    $sheet.Cells(6, 5) = "{}"  # E6: Fecha completa en español
    
    # DATOS ADMINISTRATIVOS
    $sheet.Cells(7, 1) = "Expte. Nº {}"  # A7: Expediente completo
    $sheet.Cells(8, 1) = "Resolución interna Nº {}"  # A8: Resolución
    $sheet.Cells(9, 1) = "{}"  # A9: Tipo Contratación (sin prefijo)
    
    # PROVEEDOR
    $sheet.Cells(11, 3) = "{}"  # C11: Señor (mayúsculas)
    $sheet.Cells(12, 3) = "{}"  # C12: Domicilio
    $sheet.Cells(13, 3) = "{}"  # C13: CUIT
    
    "Datos básicos escritos" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # RENGLONES (tabla comienza en fila 26)
    $renglones = @(
        {}
    )
    
    $numRenglones = $renglones.Count
    $firstRenglon = 26
    
    # Si hay más de 1 renglón, necesitamos copiar la fila template
    if ($numRenglones -gt 1) {{
        # Copiar la fila 26 (template) para cada renglón adicional
        for ($i = 1; $i -lt $numRenglones; $i++) {{
            $targetRow = $firstRenglon + $i
            # Copiar toda la fila 26 a la fila destino
            $sheet.Rows($firstRenglon).Copy() | Out-Null
            $sheet.Rows($targetRow).Insert(-4121) | Out-Null  # xlShiftDown = -4121
        }}
    }}
    
    # Normalizar bordes de todas las filas de renglones para que tengan el mismo grosor
    $lastRenglon = $firstRenglon + $numRenglones - 1
    for ($row = $firstRenglon; $row -le $lastRenglon; $row++) {{
        for ($col = 1; $col -le 6; $col++) {{
            $cell = $sheet.Cells($row, $col)
            # Aplicar bordes uniformes a TODOS los lados (Weight = 2 es fino/normal)
            $cell.Borders.Item(7).Weight = 2    # xlEdgeLeft
            $cell.Borders.Item(8).Weight = 2    # xlEdgeTop
            $cell.Borders.Item(9).Weight = 2    # xlEdgeBottom
            $cell.Borders.Item(10).Weight = 2   # xlEdgeRight
            $cell.Borders.Item(11).Weight = 2   # xlInsideVertical
            $cell.Borders.Item(12).Weight = 2   # xlInsideHorizontal
        }}
    }}
    
    # Normalizar bordes del rango completo de la tabla
    $tableRange = $sheet.Range($sheet.Cells($firstRenglon, 1), $sheet.Cells($lastRenglon, 6))
    $tableRange.Borders.Weight = 2  # Normalizar todos los bordes del rango
    
    $currentRow = 26
    foreach ($item in $renglones) {{
        $sheet.Cells($currentRow, 1) = $item.num          # A: Índice
        $sheet.Cells($currentRow, 2) = $item.cant         # B: Cantidad
        $sheet.Cells($currentRow, 3) = $item.detalle      # C: Detalle
        $sheet.Cells($currentRow, 3).WrapText = $true
        $sheet.Cells($currentRow, 4) = $item.marca        # D: Marca
        $sheet.Cells($currentRow, 5) = $item.precio       # E: Precio unitario
        # La celda F ya tiene la fórmula del template, solo actualizarla
        $fila = $currentRow
        $sheet.Cells($currentRow, 6).Formula = "=B$fila*E$fila"
        $currentRow++
    }}
    
    "Renglones escritos" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    # TOTALES - Escribir en la fila después del último renglón
    $totalRow = 26 + $numRenglones
    $sheet.Cells($totalRow, 6) = {}  # Total numérico
    $sheet.Cells($totalRow + 2, 3) = "{}"  # Total en letras
    
    "Totales escritos" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook.Save()
    "Excel guardado" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    $workbook.Close($true)
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()

    "[{{0}}] OK" -f (Get-Date) | Out-File -FilePath $logFile -Append -Encoding UTF8
}} catch {{
    "[{{0}}] ERROR: {{1}}" -f (Get-Date), $_.Exception.Message | Out-File -FilePath $logFile -Append -Encoding UTF8
    if ($excel) {{
        $excel.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }}
    Write-Error $_.Exception.Message
    exit 1
}}
"#,
        excel_path,
        log_path.to_string_lossy(),
        data.numero_oc.replace("\"", "\"\""),
        data.pedido_nro,
        data.destino.replace("\"", "\"\""),
        data.fecha.replace("\"", "\"\""),
        data.expediente_numero.replace("\"", "\"\""),
        data.resolucion_nro.unwrap_or_else(|| "S/N".to_string()).replace("\"", "\"\""),
        data.tipo_contratacion.replace("\"", "\"\""),
        data.señor.to_uppercase().replace("\"", "\"\""),
        data.domicilio.replace("\"", "\"\""),
        data.cuit.replace("\"", "\"\""),
        renglones_ps,
        data.total,
        data.total_en_letras.replace("\"", "\"\"")
    );
    
    // Escribir script con UTF-8 BOM
    let script_bytes = format!("\u{FEFF}{}", script_content);
    fs::write(&script_path, script_bytes.as_bytes())
        .map_err(|e| format!("Error al crear script PowerShell: {}", e))?;
    
    Ok(script_path)
}

pub fn ejecutar_llenado_excel_con_datos(excel_path: &str, data: OCExcelData) -> Result<(), String> {
    use std::process::Command;
    
    let script_path = crear_script_powershell_excel_con_datos(excel_path, data)?;
    
    let output = Command::new("powershell.exe")
        .arg("-NoProfile")
        .arg("-WindowStyle")
        .arg("Hidden")
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-File")
        .arg(script_path.to_str().ok_or("Ruta de script inválida")?)
        .output()
        .map_err(|e| format!("Error al ejecutar PowerShell: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error al ejecutar PowerShell: {}", stderr));
    }

    Ok(())
}
