# 🎯 Sistema de Captura Global de Expedientes InfoGov - Guía Completa

## Descripción General

Se ha implementado un **sistema de atajo de teclado global** que permite capturar automáticamente expedientes de InfoGov mediante **Alt+I**. El sistema:

1. **Captura el portapapeles** cuando presionas `Alt+I`
2. **Parsea automáticamente** los datos de InfoGov
3. **Extrae campos** como nro_infogov, tema, estado, etc.
4. **Realiza UPSERT** en la base de datos (crea o actualiza)
5. **Notifica en tiempo real** con Toast notifications en la UI

---

## Características Implementadas

### ✅ Backend (Rust/Tauri)

#### 1. **Parser de InfoGov** (`src-tauri/src/utils/infogov_parser.rs`)
- Extrae `nro_infogov` de los primeros 3 números (ej: 817619-30-2026)
- Captura `tema` (descripción después del año)
- Busca `nro_gde` con patrón EX-YYYY-XXXXX-ABCDE-FGHIJ
- Parsea `fecha_pase` de formato DD/MM/YYYY → YYYY-MM-DD
- Extrae `estado` (ej: "Contratación Directa")
- Calcula `oficina` desde el nro_gde
- Genera `resumen` automático: `nro_infogov + ' - ' + tema + ' - ' + nro_gde`

#### 2. **UPSERT en Base de Datos** (`src-tauri/src/repositories/expediente_repository.rs`)
- Busca si `nro_infogov` ya existe
- **Si existe**: Actualiza `fecha_pase`, `estado`, `resumen`
- **Si no existe**: Crea nuevo expediente con todos los campos
- Usa **transacción** para integridad de datos

#### 3. **Comando Tauri** (`src-tauri/src/commands/expedientes.rs`)
- `procesar_y_guardar_expediente(raw_text: String)` 
- Retorna `ProcesarExpedienteResult` con id, resumen y mensaje
- Maneja errores de parseo con `Result`

#### 4. **Atajo Global** (`src-tauri/src/lib.rs`)
- Registra `Alt+I` usando `tauri_plugin_global_shortcut`
- Lee portapapeles con `tauri_plugin_clipboard_manager`
- Emite eventos `expediente_procesado` y `expediente_error` al frontend
- Logs detallados en consola (🔥 🎯 ✅ ❌)

### ✅ Frontend (React/TypeScript)

#### 1. **Component Toast** (`src/components/Toast.tsx`)
- Notificaciones non-blocking en esquina inferior derecha
- Tipos: `success`, `error`, `info`, `warning`
- Hook `useToast()` para manejo fácil
- Duración configurable (3-5 segundos)
- Animación smooth fade-in/slide

#### 2. **Listeners de Eventos** (`src/components/Dashboard.tsx`)
- Escucha `expediente_procesado` → Muestra Toast success
- Escucha `expediente_error` → Muestra Toast error
- Recarga automáticamente la lista de expedientes
- Emite notificaciones informativas

#### 3. **Integración UI**
- `<ToastContainer>` en el Dashboard
- Importa y usa `useToast()` hook
- Muestra resumen del expediente en la notificación

---

## 📋 Formato de Datos Esperado en Portapapeles

```
817619 30 2026 Reparación embrague Toyota Hilux 18/2/2026 DATOS INTERMEDIOS EX-2026-01216856-GDEMZA-DGIRR Contratación Directa
```

**Estructura:**
- **Posición 1-3**: Números separados por espacios (nro_infogov)
- **Entre año y fecha**: Tema/descripción
- **Formato DD/MM/YYYY**: Fecha de pase
- **Patrón EX-YYYY-XXXXX-ABCDE-FGHIJ**: Número GDE
- **Final de línea**: Estado/modalidad

---

## 🚀 Cómo Usar

### Básico - Capturar Expediente
1. **Copia el texto del expediente** desde InfoGov (Ctrl+C)
2. **Presiona Alt+I** en cualquier parte de la aplicación
3. **Verás una notificación** con el resultado

### Resultado Exitoso
```
✅ Expediente 817619-30-2026 procesado correctamente
   Resumen: 817619-30-2026 - Reparación embrague... - EX-2026-01216856-...
```

### Si Hay Error
```
❌ Error al capturar desde InfoGov
   Error: No se encontró nro_infogov en el formato esperado
```

---

## 🔧 Campos de Base de Datos Mapeados

| Campo | Origen | Ejemplo |
|-------|--------|---------|
| `nro_infogov` | Parser (primeros 3 números) | `817619-30-2026` |
| `nro_gde` | Patrón EX-YYYY-... | `EX-2026-01216856-GDEMZA-DGIRR` |
| `tema` | Texto descriptivo | `Reparación embrague Toyota Hilux` |
| `fecha_pase` | Parseado DD/MM/YYYY | `2026-02-18` |
| `estado` | Texto final | `Contratación Directa` |
| `oficina` | Extraído de nro_gde | `GDEMZA` |
| `resumen` | Calculado | `817619-30-2026 - Tema - NRO_GDE` |

---

## 🛠️ Dependencias Añadidas

```toml
tauri-plugin-global-shortcut = "2"      # Atajos de teclado global
tauri-plugin-clipboard-manager = "2"    # Acceso al portapapeles
regex = "1"                             # Parsing con expresiones regulares
```

---

## 📁 Archivos Modificados/Creados

### Creados
- ✅ `src-tauri/src/utils/infogov_parser.rs` - Parser de datos
- ✅ `src/components/Toast.tsx` - Sistema de notificaciones

### Modificados
- ✅ `src-tauri/Cargo.toml` - Dependencias
- ✅ `src-tauri/src/utils/mod.rs` - Exportar módulo parser
- ✅ `src-tauri/src/commands/expedientes.rs` - Comando procesar
- ✅ `src-tauri/src/repositories/expediente_repository.rs` - UPSERT
- ✅ `src-tauri/src/lib.rs` - Configurar atajo global
- ✅ `src/components/Dashboard.tsx` - Listeners y Toast

---

## 🧪 Pruebas Realizadas

### ✅ Compilación
```bash
cargo check --manifest-path src-tauri/Cargo.toml
# Resultado: ✅ Compiled successfully
```

### ✅ Parser (Unit Tests)
```rust
#[test]
fn test_from_clipboard_valid() {
    let raw_text = "817619 30 2026 Reparación embrague...";
    let result = InfoGovExpediente::from_clipboard(raw_text);
    assert!(result.is_ok());
    assert_eq!(result.unwrap().nro_infogov, "817619-30-2026");
}
```

---

## 📊 Flujo de Datos

```
[Portapapeles]
      ↓
[Alt+I presionado]
      ↓
[tauri_plugin_global_shortcut detects]
      ↓
[Lee portapapeles con clipboard_manager]
      ↓
[InfoGovExpediente::from_clipboard() parsea]
      ↓
[ExpedienteRepository::upsert_from_infogov() → SQLite]
      ↓
[Emite evento "expediente_procesado"]
      ↓
[Frontend recibe evento]
      ↓
[Toast notifica al usuario]
      ↓
[Lista de expedientes recarga]
```

---

## 🐛 Manejo de Errores

### Parseo Incorrecto
- Detección de formato inválido
- Mensaje clara: "No se encontró nro_infogov en el formato esperado"
- No crashea la aplicación

### Base de Datos
- Transacción asegurad integridad
- Rollback automático si falla
- Logs detallados en terminal

### Portapapeles
- Si no es readable: "Error al leer portapapeles"
- Continúa funcionando

---

## 🔮 Mejoras Futuras

- [ ] Agregar validación de formato antes de parsear
- [ ] Implementar caché de últimos expedientes capturados
- [ ] Soporte para múltiples formatos de InfoGov
- [ ] Estadísticas de expedientes capturados
- [ ] Atajos adicionales (Alt+U para deshacer último, etc.)

---

## 📞 Soporte

Si el atajo no funciona:
1. Verifica que `Alt+I` no esté en conflicto con otro programa
2. Revisa la consola del desarrollador (F12) para logs
3. Asegúrate que el portapapeles tiene datos en el formato correcto

