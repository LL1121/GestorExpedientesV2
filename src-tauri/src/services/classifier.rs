use crate::models::CategoriaGasto;
use std::collections::HashMap;

/// Estructura para clasificación de gastos
#[derive(Debug, Clone)]
pub struct ExpenseClassification {
    pub categoria: CategoriaGasto,
    pub palabras_clave_detectadas: Vec<String>,
    pub patente_detectada: Option<String>, // Patente del vehículo detectada
}

/// Servicio de clasificación de gastos
pub struct GastoClassifier;

impl GastoClassifier {
    /// Diccionario de palabras clave para categorización
    /// Se puede extender con más palabras según sea necesario
    fn get_keywords() -> HashMap<CategoriaGasto, Vec<&'static str>> {
        let mut keywords: HashMap<CategoriaGasto, Vec<&'static str>> = HashMap::new();

        // Combustible
        keywords.insert(
            CategoriaGasto::Combustible,
            vec![
                "nafta",
                "gasoil",
                "diesel",
                "gnc",
                "gas natural",
                "ypf",
                "shell",
                "axion",
                "puma",
                "combustible",
                "litro",
                "litros",
                "carga combustible",
                "carga de nafta",
                "carga de gasoil",
                "tanque",
                "tanque lleno",
                "surtidor",
                "estación de servicio",
                "estacion servicio",
                "gasolinera",
                "venta de combustible",
                "factura combustible",
                "ticket combustible",
                "ticket ypf",
                "ticket shell",
                "nafta super",
                "nafta premium",
                "infinia",
                "v-power",
            ],
        );

        // Repuestos
        keywords.insert(
            CategoriaGasto::Repuestos,
            vec![
                "amortiguador",
                "amortiguadores",
                "cubierta",
                "cubiertas",
                "neumático",
                "neumaticos",
                "llanta",
                "llantas",
                "goma",
                "gomas",
                "batería",
                "bateria",
                "acumulador",
                "aceite",
                "aceite motor",
                "lubricante",
                "bujía",
                "bujías",
                "bujia",
                "repuesto",
                "repuestos",
                "pieza",
                "piezas",
                "filtro",
                "filtros",
                "filtro aceite",
                "filtro aire",
                "filtro combustible",
                "filtro habitáculo",
                "correa",
                "correas",
                "correa distribución",
                "correa distribucion",
                "pastilla freno",
                "pastillas freno",
                "disco freno",
                "discos freno",
                "cable",
                "cables",
                "cable bujía",
                "espejo",
                "espejos",
                "retrovisor",
                "faro",
                "faros",
                "óptica",
                "optica",
                "parabrisas",
                "luneta",
                "vidrio",
                "paragolpe",
                "paragolpes",
                "guardabarros",
                "capot",
                "puerta",
                "embrague",
                "kit embrague",
                "alternador",
                "burro arranque",
                "motor arranque",
                "radiador",
                "bomba agua",
                "bomba nafta",
                "sensor",
                "sensores",
            ],
        );

        // Mantenimiento
        keywords.insert(
            CategoriaGasto::Mantenimiento,
            vec![
                "reparación",
                "reparacion",
                "taller",
                "mecánico",
                "mecanico",
                "service",
                "mantenimiento",
                "mantencion",
                "revisión",
                "revision",
                "inspección",
                "inspeccion",
                "diagnóstico",
                "diagnostico",
                "servicio técnico",
                "servicio tecnico",
                "tecnico",
                "ajuste",
                "limpieza",
                "limpieza motor",
                "lavado",
                "lavado chasis",
                "engrasado",
                "engrase",
                "alineación",
                "alineacion",
                "balanceo",
                "reparacion de auto",
                "cambio aceite",
                "cambio filtro",
                "cambio correa",
                "mano de obra",
                "hora taller",
                "horas taller",
                "instalación",
                "instalacion",
                "montaje",
                "desmontaje",
                "control",
                "control general",
                "verificación",
                "verificacion",
                "verificación técnica",
                "vtv",
                "rv",
                "revision tecnica",
                "chapa pintura",
                "chapa y pintura",
                "pintura",
                "soldadura",
                "electricidad",
                "electricidad auto",
                "computadora",
                "escaneo",
                "reseteo",
                "programación",
                "programacion",
            ],
        );

        keywords
    }

    /// Clasifica un texto de expediente y retorna la categoría detectada
    pub fn classify(
        asunto: &str,
        descripcion: Option<&str>,
        tema: Option<&str>,
    ) -> Option<ExpenseClassification> {
        let keywords = Self::get_keywords();

        // Combinar todos los textos disponibles
        let full_text = format!(
            "{} {} {}",
            asunto,
            descripcion.unwrap_or(""),
            tema.unwrap_or("")
        );
        let full_text_lower = full_text.to_lowercase();

        // Buscar la categoría con más coincidencias
        let mut best_match: Option<(CategoriaGasto, Vec<String>)> = None;
        let mut max_matches = 0;

        for (categoria, words) in keywords.iter() {
            let mut matches = Vec::new();
            for word in words {
                if full_text_lower.contains(word) {
                    matches.push(word.to_string());
                    // Contar palabras encontradas (evitar duplicados)
                    if matches.len() > max_matches {
                        max_matches = matches.len();
                        best_match = Some((categoria.clone(), matches.clone()));
                    }
                }
            }
        }

        // Si encontramos al menos una palabra clave, retornar la clasificación
        best_match.map(|(categoria, palabras_detectadas)| ExpenseClassification {
            categoria,
            palabras_clave_detectadas: palabras_detectadas,
            patente_detectada: Self::extract_patente(&full_text_lower),
        })
    }

    /// Intenta detectar una patente de vehículo del texto
    /// Patentes argentinas: 2 letras + 3 números + 2 letras (ej: AA123BB)
    fn extract_patente(text: &str) -> Option<String> {
        // Buscar patrón: 2 letras + 3 dígitos + 2 letras
        // Patente vieja: ABC1234
        // Patente nueva: AB123CD

        // Buscar patente vieja (3 letras + 4 números)
        if let Some(start) = text.find(|c: char| c.is_alphabetic()) {
            let chars: Vec<char> = text.chars().collect();
            if start + 6 <= chars.len() {
                let potential = format!(
                    "{}{}{}{}{}{}{}",
                    chars[start],
                    chars[start + 1],
                    chars[start + 2],
                    chars[start + 3],
                    chars[start + 4],
                    chars[start + 5],
                    chars[start + 6]
                );
                if potential.chars().take(3).all(|c| c.is_alphabetic())
                    && potential.chars().skip(3).take(4).all(|c| c.is_numeric())
                {
                    return Some(potential.to_uppercase());
                }
            }
        }

        // Buscar patente nueva (2 letras + 3 números + 2 letras)
        if let Some(start) = text.find(|c: char| c.is_alphabetic()) {
            let chars: Vec<char> = text.chars().collect();
            if start + 6 <= chars.len() {
                let potential = format!(
                    "{}{}{}{}{}{}",
                    chars[start],
                    chars[start + 1],
                    chars[start + 2],
                    chars[start + 3],
                    chars[start + 4],
                    chars[start + 5]
                );
                if potential.chars().take(2).all(|c| c.is_alphabetic())
                    && potential.chars().skip(2).take(3).all(|c| c.is_numeric())
                    && potential.chars().skip(5).all(|c| c.is_alphabetic())
                {
                    return Some(potential.to_uppercase());
                }
            }
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_combustible() {
        let result =
            GastoClassifier::classify("Compra de nafta YPF", Some("45 litros"), None);
        assert!(result.is_some());
        let class = result.unwrap();
        assert!(matches!(class.categoria, CategoriaGasto::Combustible));
    }

    #[test]
    fn test_classify_repuestos() {
        let result = GastoClassifier::classify("Batería para camioneta", Some("Repuesto"), None);
        assert!(result.is_some());
        let class = result.unwrap();
        assert!(matches!(class.categoria, CategoriaGasto::Repuestos));
    }

    #[test]
    fn test_classify_mantenimiento() {
        let result =
            GastoClassifier::classify("Servicio técnico en taller", Some("Mecánico"), None);
        assert!(result.is_some());
        let class = result.unwrap();
        assert!(matches!(class.categoria, CategoriaGasto::Mantenimiento));
    }

    #[test]
    fn test_extract_patente_vieja() {
        let text = "Expediente vehículo ABC1234 compra de repuestos";
        let patente = GastoClassifier::extract_patente(text);
        assert_eq!(patente, Some("ABC1234".to_string()));
    }
}
