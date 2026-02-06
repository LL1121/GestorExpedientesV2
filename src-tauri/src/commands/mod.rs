// Módulo de Tauri Commands
// Agrupa todos los commands que el frontend puede invocar

pub mod expedientes;
pub mod vehiculos;
pub mod tickets;
pub mod agentes;
pub mod exports;

pub use expedientes::*;
pub use vehiculos::*;
pub use tickets::*;
pub use agentes::*;
pub use exports::*;
