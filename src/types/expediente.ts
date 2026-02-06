// Tipos para Expedientes
// Coinciden con los modelos de Rust

export type TipoExpediente = "InfoGov" | "Gde" | "Interno" | "Otro";
export type EstadoExpediente = "Iniciado" | "EnProceso" | "EnRevision" | "Observado" | "Finalizado" | "Archivado";
export type Prioridad = "Baja" | "Media" | "Alta" | "Urgente";

export interface Expediente {
  id: string;
  numero: string;
  año: number;
  tipo: TipoExpediente;
  asunto: string;
  descripcion: string | null;
  area_responsable: string;
  prioridad: Prioridad;
  estado: EstadoExpediente;
  fecha_inicio: string;
  fecha_vencimiento: string | null;
  fecha_finalizacion: string | null;
  agente_responsable_id: string | null;
  archivos_adjuntos: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface CreateExpedienteInput {
  numero: string;
  año: number;
  tipo: TipoExpediente;
  asunto: string;
  descripcion?: string;
  area_responsable: string;
  prioridad: Prioridad;
  fecha_inicio: string;
  fecha_vencimiento?: string;
  agente_responsable_id?: string;
}

export interface UpdateExpedienteInput {
  asunto?: string;
  descripcion?: string;
  prioridad?: Prioridad;
  estado?: EstadoExpediente;
  fecha_vencimiento?: string;
  fecha_finalizacion?: string;
  agente_responsable_id?: string;
  observaciones?: string;
}
