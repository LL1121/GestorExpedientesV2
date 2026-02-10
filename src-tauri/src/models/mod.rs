// Módulo central de modelos de datos
// Cada modelo representa una tabla en la base de datos

pub mod agente;
pub mod expediente;
pub mod vehiculo;
pub mod ticket;
pub mod orden_compra;

// Re-exportar para facilitar el uso
pub use agente::Agente;
pub use expediente::Expediente;
pub use vehiculo::Vehiculo;
pub use ticket::Ticket;
