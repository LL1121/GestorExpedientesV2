// Parser para expedientes de InfoGov
// Extrae datos del formato de portapapeles de InfoGov y los estructura para la base de datos

use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfoGovExpediente {
    pub nro_infogov: String,      // 817619-30-2026
    pub tema: String,              // Reparación embrague Toyota Hilux...
    pub nro_gde: String,           // EX-2026-01216856-GDEMZA-DGIRR
    pub fecha_pase: String,        // 2026-02-18 (ISO format)
    pub estado: String,            // Contratación Directa
    pub oficina: Option<String>,   // Extraído de nro_gde (GDEMZA)
    pub resumen: String,           // nro_infogov + ' - ' + tema + ' - ' + nro_gde
}

impl InfoGovExpediente {
    /// Parsea un texto del portapapeles de InfoGov
    /// Formato esperado: "817619 30 2026 Reparación embrague... 18/2/2026 ... EX-2026-01216856-GDEMZA-DGIRR Contratación Directa"
    pub fn from_clipboard(raw_text: &str) -> Result<Self, String> {
        let cleaned = raw_text.trim();
        
        if cleaned.is_empty() {
            return Err("El portapapeles está vacío".to_string());
        }

        // Extraer nro_infogov (primeros 3 números con espacios)
        let nro_infogov_regex = Regex::new(r"^(\d+)\s+(\d+)\s+(\d+)")
            .map_err(|e| format!("Error en regex nro_infogov: {}", e))?;
        
        let nro_infogov_caps = nro_infogov_regex
            .captures(cleaned)
            .ok_or_else(|| "No se encontró nro_infogov en el formato esperado".to_string())?;
        
        let nro_infogov = format!(
            "{}-{}-{}",
            &nro_infogov_caps[1],
            &nro_infogov_caps[2],
            &nro_infogov_caps[3]
        );

        // Encontrar la posición final del nro_infogov
        let after_nro = cleaned
            .find(&nro_infogov_caps[3])
            .ok_or_else(|| "Error al procesar nro_infogov".to_string())?
            + nro_infogov_caps[3].len();
        
        let remaining = &cleaned[after_nro..].trim_start();

        // Extraer tema (hasta encontrar una fecha o el patrón EX-)
        let tema_fecha_regex = Regex::new(r"^(.+?)\s+(\d{1,2}/\d{1,2}/\d{4})")
            .map_err(|e| format!("Error en regex tema/fecha: {}", e))?;
        
        let (tema, fecha_str) = if let Some(caps) = tema_fecha_regex.captures(remaining) {
            (caps[1].to_string(), caps[2].to_string())
        } else {
            return Err("No se encontró fecha en formato DD/MM/YYYY".to_string());
        };

        // Parsear fecha DD/MM/YYYY a YYYY-MM-DD
        let fecha_pase = parse_fecha_dmy(&fecha_str)?;

        // Encontrar y extraer nro_gde (EX-YYYY-XXXXX-ABCDE-FGHIJ)
        let nro_gde_regex = Regex::new(r"(EX-\d{4}-\d{8}-[A-Z]{6}-[A-Z]{5})")
            .map_err(|e| format!("Error en regex nro_gde: {}", e))?;
        
        let nro_gde = nro_gde_regex
            .captures(remaining)
            .ok_or_else(|| "No se encontró nro_gde con patrón EX-XXXX-...".to_string())?[1]
            .to_string();

        // Extraer oficina del nro_gde (parte después del segundo guión)
        let oficina = extract_oficina(&nro_gde);

        // Extraer estado (último campo, texto hasta fin de línea)
        let estado_regex = Regex::new(r"(Contratación\s+Directa|[A-Z][a-záé\s]+)$")
            .map_err(|e| format!("Error en regex estado: {}", e))?;
        
        let estado = estado_regex
            .captures(remaining)
            .map(|c| c[1].to_string())
            .unwrap_or_else(|| "Desconocido".to_string());

        // Generar resumen
        let resumen = format!("{} - {} - {}", nro_infogov, tema, nro_gde);

        Ok(InfoGovExpediente {
            nro_infogov,
            tema: tema.trim().to_string(),
            nro_gde,
            fecha_pase,
            estado,
            oficina,
            resumen,
        })
    }
}

/// Parsea una fecha en formato DD/MM/YYYY a YYYY-MM-DD
fn parse_fecha_dmy(fecha_str: &str) -> Result<String, String> {
    let parts: Vec<&str> = fecha_str.split('/').collect();
    
    if parts.len() != 3 {
        return Err(format!("Formato de fecha inválido: {}", fecha_str));
    }

    let day = parts[0].parse::<u32>()
        .map_err(|_| format!("Día inválido: {}", parts[0]))?;
    let month = parts[1].parse::<u32>()
        .map_err(|_| format!("Mes inválido: {}", parts[1]))?;
    let year = parts[2].parse::<u32>()
        .map_err(|_| format!("Año inválido: {}", parts[2]))?;

    if month < 1 || month > 12 {
        return Err(format!("Mes fuera de rango: {}", month));
    }

    if day < 1 || day > 31 {
        return Err(format!("Día fuera de rango: {}", day));
    }

    Ok(format!("{:04}-{:02}-{:02}", year, month, day))
}

/// Extrae la oficina del nro_gde
/// Patrón: EX-YYYY-XXXXX-OFICINA-SIGLA
fn extract_oficina(nro_gde: &str) -> Option<String> {
    let parts: Vec<&str> = nro_gde.split('-').collect();
    if parts.len() >= 4 {
        Some(parts[3].to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_fecha_dmy() {
        assert_eq!(parse_fecha_dmy("18/2/2026").unwrap(), "2026-02-18");
        assert_eq!(parse_fecha_dmy("01/12/2025").unwrap(), "2025-12-01");
    }

    #[test]
    fn test_extract_oficina() {
        let nro_gde = "EX-2026-01216856-GDEMZA-DGIRR";
        assert_eq!(extract_oficina(nro_gde), Some("GDEMZA".to_string()));
    }

    #[test]
    fn test_from_clipboard_valid() {
        let raw_text = "817619 30 2026 Reparación embrague Toyota Hilux 18/2/2026 datos intermedios EX-2026-01216856-GDEMZA-DGIRR Contratación Directa";
        let result = InfoGovExpediente::from_clipboard(raw_text);
        
        assert!(result.is_ok());
        let exp = result.unwrap();
        assert_eq!(exp.nro_infogov, "817619-30-2026");
        assert_eq!(exp.fecha_pase, "2026-02-18");
        assert_eq!(exp.nro_gde, "EX-2026-01216856-GDEMZA-DGIRR");
        assert_eq!(exp.oficina, Some("GDEMZA".to_string()));
    }

    #[test]
    fn test_from_clipboard_empty() {
        let result = InfoGovExpediente::from_clipboard("");
        assert!(result.is_err());
    }
}
