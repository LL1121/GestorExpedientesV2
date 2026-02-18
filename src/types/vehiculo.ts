export type TipoVehiculo = "Camioneta" | "Auto" | "Camion" | "Máquina" | "Otro";
export type EstadoVehiculo = "Activo" | "Mantenimiento" | "Inactivo";

export interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
  kilometraje: number;
  personas_habilitadas: string[]; // Array de nombres de personas habilitadas
  created_at: string;
  updated_at: string;
}

export interface CreateVehiculoInput {
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo: TipoVehiculo;
  kilometraje: number;
  personas_habilitadas?: string[];
}

export interface TicketCombustible {
  id: string;
  vehiculo_id: string;
  vehiculo_patente: string;
  fecha: string;
  litros: number;
  precio_total: number;
  kilometraje_actual: number;
  created_at: string;
}

export interface CreateTicketInput {
  vehiculo_id: string;
  fecha: string;
  litros: number;
  precio_total: number;
  kilometraje_actual: number;
}

export interface Consumible {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  stock_minimo: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConsumibleInput {
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  stock_minimo: number;
}

export interface HistorialMecanico {
  id: string;
  vehiculo_id: string;
  vehiculo_patente: string;
  fecha: string;
  tipo_trabajo: string; // "Mantenimiento", "Reparación", "Revisión", etc.
  descripcion: string;
  costo?: number;
  taller?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHistorialMecanicoInput {
  vehiculo_id: string;
  fecha: string;
  tipo_trabajo: string;
  descripcion: string;
  costo?: number;
  taller?: string;
}
