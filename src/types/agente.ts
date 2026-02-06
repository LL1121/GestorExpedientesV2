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
}

export type SemaforoStatus = "rojo" | "naranja" | "verde";

export interface AgenteConSemaforo extends Agente {
  dias_restantes?: number;
  semaforo_status?: SemaforoStatus;
}
