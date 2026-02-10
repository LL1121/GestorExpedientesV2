// Modelos para el sistema de Órdenes de Compra
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Proveedor {
    pub id: String,
    pub nombre: String,
    pub cuit: String,
    pub domicilio: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProveedor {
    pub nombre: String,
    pub cuit: String,
    pub domicilio: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConfigTope {
    pub id: i32,
    pub tipo_contratacion: String,
    pub monto_maximo: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfigTope {
    pub id: i32,
    pub monto_maximo: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrdenCompra {
    pub id: String,
    pub numero_oc: String,
    pub pedido_nro: i32,
    pub destino: String,
    pub fecha: String,
    pub expediente_id: String,
    pub resolucion_nro: Option<String>,
    pub forma_pago: String,
    pub plazo_entrega: String,
    pub es_iva_inscripto: bool,
    pub tipo_contratacion: String,
    pub subtotal: f64,
    pub iva: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrdenCompra {
    pub destino: Option<String>,
    pub expediente_id: String,
    pub resolucion_nro: Option<String>,
    pub forma_pago: String,
    pub plazo_entrega: Option<String>,
    pub es_iva_inscripto: bool,
    pub renglones: Vec<CreateRenglon>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrdenCompraRenglon {
    pub id: String,
    pub oc_id: String,
    pub renglon_nro: i32,
    pub cantidad: f64,
    pub detalle: String,
    pub marca: Option<String>,
    pub valor_unitario: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRenglon {
    pub cantidad: f64,
    pub detalle: String,
    pub marca: Option<String>,
    pub valor_unitario: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrdenCompraCompleta {
    pub orden: OrdenCompra,
    pub renglones: Vec<OrdenCompraRenglon>,
    pub total_en_letras: String,
}

/// Determina el tipo de contratación según el monto total
pub fn determinar_tipo_contratacion(monto: f64, topes: &[ConfigTope]) -> String {
    let mut topes_ordenados = topes.to_vec();
    topes_ordenados.sort_by(|a, b| a.monto_maximo.partial_cmp(&b.monto_maximo).unwrap());

    for tope in topes_ordenados.iter() {
        if monto <= tope.monto_maximo {
            return tope.tipo_contratacion.clone();
        }
    }

    // Si supera todos los topes, usar el más alto
    topes_ordenados
        .last()
        .map(|t| t.tipo_contratacion.clone())
        .unwrap_or_else(|| "Licitación pública de mayor monto".to_string())
}

/// Genera el siguiente número de OC con formato XX/YYYY
pub fn generar_numero_oc(ultima_oc: Option<String>, año_actual: i32) -> String {
    match ultima_oc {
        Some(ultimo) => {
            // Formato: "15/2025"
            let partes: Vec<&str> = ultimo.split('/').collect();
            if partes.len() == 2 {
                let numero = partes[0].parse::<i32>().unwrap_or(0);
                let año = partes[1].parse::<i32>().unwrap_or(año_actual - 1);

                if año == año_actual {
                    // Mismo año, incrementar número
                    format!("{:02}/{}", numero + 1, año_actual)
                } else {
                    // Nuevo año, resetear a 01
                    format!("01/{}", año_actual)
                }
            } else {
                format!("01/{}", año_actual)
            }
        }
        None => format!("01/{}", año_actual),
    }
}

/// Calcula subtotal, IVA y total
pub fn calcular_totales(renglones: &[CreateRenglon], es_iva_inscripto: bool) -> (f64, f64, f64) {
    let subtotal: f64 = renglones
        .iter()
        .map(|r| r.cantidad * r.valor_unitario)
        .sum();

    let tasa_iva = if es_iva_inscripto { 0.21 } else { 0.105 };
    let iva = subtotal * tasa_iva;
    let total = subtotal + iva;

    (subtotal, iva, total)
}

/// Convierte un monto a letras (español argentino oficial)
pub fn monto_a_letras(monto: f64) -> String {
    let entero = monto.floor() as i64;
    let centavos = ((monto - entero as f64) * 100.0).round() as i64;

    let texto_entero = numero_a_texto(entero);
    
    if entero == 1 {
        format!("UN PESO CON {:02}/100.-", centavos)
    } else {
        format!("{} PESOS CON {:02}/100.-", texto_entero.to_uppercase(), centavos)
    }
}

fn numero_a_texto(n: i64) -> String {
    if n == 0 {
        return "cero".to_string();
    }

    let unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    let decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    let especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
    let centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

    if n < 10 {
        return unidades[n as usize].to_string();
    }
    
    if n < 20 {
        return especiales[(n - 10) as usize].to_string();
    }
    
    if n < 100 {
        let d = n / 10;
        let u = n % 10;
        if u == 0 {
            return decenas[d as usize].to_string();
        }
        if d == 2 {
            return format!("veinti{}", unidades[u as usize]);
        }
        return format!("{} y {}", decenas[d as usize], unidades[u as usize]);
    }
    
    if n == 100 {
        return "cien".to_string();
    }
    
    if n < 1000 {
        let c = n / 100;
        let resto = n % 100;
        if resto == 0 {
            return centenas[c as usize].to_string();
        }
        return format!("{} {}", centenas[c as usize], numero_a_texto(resto));
    }
    
    if n < 1_000_000 {
        let miles = n / 1000;
        let resto = n % 1000;
        let texto_miles = if miles == 1 {
            "mil".to_string()
        } else {
            format!("{} mil", numero_a_texto(miles))
        };
        
        if resto == 0 {
            return texto_miles;
        }
        return format!("{} {}", texto_miles, numero_a_texto(resto));
    }
    
    if n < 1_000_000_000 {
        let millones = n / 1_000_000;
        let resto = n % 1_000_000;
        let texto_millones = if millones == 1 {
            "un millón".to_string()
        } else {
            format!("{} millones", numero_a_texto(millones))
        };
        
        if resto == 0 {
            return texto_millones;
        }
        return format!("{} {}", texto_millones, numero_a_texto(resto));
    }
    
    "número muy grande".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_monto_a_letras() {
        assert_eq!(monto_a_letras(228000.00), "DOSCIENTOS VEINTIOCHO MIL PESOS CON 00/100.-");
        assert_eq!(monto_a_letras(1.50), "UN PESO CON 50/100.-");
        assert_eq!(monto_a_letras(15750.25), "QUINCE MIL SETECIENTOS CINCUENTA PESOS CON 25/100.-");
    }

    #[test]
    fn test_generar_numero_oc() {
        assert_eq!(generar_numero_oc(Some("15/2025".to_string()), 2026), "01/2026");
        assert_eq!(generar_numero_oc(Some("15/2026".to_string()), 2026), "16/2026");
        assert_eq!(generar_numero_oc(None, 2026), "01/2026");
    }

    #[test]
    fn test_calcular_totales() {
        let renglones = vec![
            CreateRenglon {
                cantidad: 10.0,
                detalle: "Item 1".to_string(),
                marca: None,
                valor_unitario: 1000.0,
            },
            CreateRenglon {
                cantidad: 5.0,
                detalle: "Item 2".to_string(),
                marca: None,
                valor_unitario: 2000.0,
            },
        ];
        
        let (subtotal, iva, total) = calcular_totales(&renglones, true);
        assert_eq!(subtotal, 20000.0);
        assert_eq!(iva, 4200.0);
        assert_eq!(total, 24200.0);
    }

    #[test]
    fn test_determinar_tipo_contratacion() {
        let topes = vec![
            ConfigTope { id: 1, tipo_contratacion: "Directa".to_string(), monto_maximo: 5000000.0 },
            ConfigTope { id: 2, tipo_contratacion: "Directa con pub".to_string(), monto_maximo: 15000000.0 },
        ];
        
        assert_eq!(determinar_tipo_contratacion(3000000.0, &topes), "Directa");
        assert_eq!(determinar_tipo_contratacion(10000000.0, &topes), "Directa con pub");
    }
}
