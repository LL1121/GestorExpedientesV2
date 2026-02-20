export type TipoLicencia = "B1" | "B2" | "C1" | "C2" | "D1" | "D2" | "Profesional";

export interface Agente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  legajo: string;
  area: string;
  tipo_licencia?: TipoLicencia;
  fecha_vencimiento_licencia?: string;
  // Información Personal
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  // Información Laboral
  fecha_ingreso?: string;
  cargo?: string;
  // Tallas
  talla_camisa?: string;
  talla_pantalon?: string;
  talla_calzado?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgenteInput {
  nombre: string;
  apellido: string;
  dni: string;
  legajo: string;
  area: string;
  tipo_licencia?: TipoLicencia;
  fecha_vencimiento_licencia?: string;
  // Información Personal
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  // Información Laboral
  fecha_ingreso?: string;
  cargo?: string;
  // Tallas
  talla_camisa?: string;
  talla_pantalon?: string;
  talla_calzado?: string;
}

export type SemaforoStatus = "rojo" | "naranja" | "verde";

export interface AgenteConSemaforo extends Agente {
  dias_restantes?: number;
  semaforo_status?: SemaforoStatus;
}
