// Tipos para Expedientes
// Coinciden con los modelos de Rust

export type TipoExpediente = "InfoGov" | "Gde" | "Interno" | "Pago" | "Otro";
export type EstadoExpediente = "Iniciado" | "EnProceso" | "EnRevision" | "Observado" | "Finalizado" | "Archivado";
export type Prioridad = "Baja" | "Media" | "Alta" | "Urgente";

export interface Expediente {
  id: string;
  numero: string;
  año: number;
  tipo: TipoExpediente;
  
  // Campos comunes a todos los expedientes
  archivo?: string | null;
  nro_infogov?: string | null;
  tema?: string | null;
  nro_gde?: string | null;
  fecha_inicio: string;
  fecha_pase?: string | null;
  oficina?: string | null;
  estado: EstadoExpediente;
  buzon_grupal?: string | null;
  hacer?: string | null;
  resumen?: string | null; // Combinación de nro_infogov + resumen + nro_gde
  
  // Campos legacy/adicionales
  caratula?: string | null;
  resolucion_nro?: string | null;
  asunto: string;
  descripcion: string | null;
  area_responsable: string;
  prioridad: Prioridad;
  fecha_vencimiento: string | null;
  fecha_finalizacion: string | null;
  agente_responsable_id: string | null;
  archivos_adjuntos: string | null;
  observaciones: string | null;
  
  // Campos extra para expedientes de tipo "Pago"
  oc_señor?: string | null;
  oc_domicilio?: string | null;
  oc_cuit?: string | null;
  oc_descripcion_zona?: string | null;
  oc_forma_pago?: string | null;
  oc_plazo_entrega?: string | null;
  factura_path?: string | null;
  
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface CreateExpedienteInput {
  numero: string;
  año: number;
  tipo: TipoExpediente;
  
  // Campos comunes
  archivo?: string;
  nro_infogov?: string;
  tema?: string;
  nro_gde?: string;
  fecha_inicio: string;
  fecha_pase?: string;
  oficina?: string;
  buzon_grupal?: string;
  hacer?: string;
  
  // Campos legacy/adicionales
  caratula?: string;
  resolucion_nro?: string;
  asunto: string;
  descripcion?: string;
  area_responsable: string;
  prioridad: Prioridad;
  fecha_vencimiento?: string;
  agente_responsable_id?: string;
  
  // Campos OC para expedientes de tipo "Pago"
  oc_señor?: string;
  oc_domicilio?: string;
  oc_cuit?: string;
  oc_descripcion_zona?: string;
  oc_forma_pago?: string;
  oc_plazo_entrega?: string;
  factura_path?: string;
}

export interface UpdateExpedienteInput {
  archivo?: string;
  nro_infogov?: string;
  tema?: string;
  nro_gde?: string;
  fecha_pase?: string;
  oficina?: string;
  buzon_grupal?: string;
  hacer?: string;
  asunto?: string;
  descripcion?: string;
  caratula?: string;
  resolucion_nro?: string;
  prioridad?: Prioridad;
  estado?: EstadoExpediente;
  fecha_vencimiento?: string;
  fecha_finalizacion?: string;
  agente_responsable_id?: string;
  observaciones?: string;
  
  // Campos OC para expedientes de tipo "Pago"
  oc_señor?: string;
  oc_domicilio?: string;
  oc_cuit?: string;
  oc_descripcion_zona?: string;
  oc_forma_pago?: string;
  oc_plazo_entrega?: string;
  factura_path?: string;
}
