export type TipoVehiculo = "Camioneta" | "Auto" | "Camion" | "Moto" | "Otro";
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
}

export interface TicketCombustible {
  id: string;
  vehiculo_id: string;
  vehiculo_patente: string;
  fecha: string;
  litros: number;
  precio_total: number;
  kilometraje_actual: number;
  rendimiento?: number; // km/l calculado
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
