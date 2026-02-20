// Tipos para sistema de notificaciones y alertas de expedientes

export type NotificationType = 
  | "pendiente_contestar"      // Expediente pendiente de respuesta
  | "pago_sin_pagar"           // Expediente de pago sin pagar
  | "expediente_vencido"       // Expediente con fecha vencida
  | "proximo_vencer"           // Expediente próximo a vencer (1 semana)
  | "sin_revisar"              // Expediente sin revisar
  | "accion_requerida"         // Requiere acción del usuario
  | "oc_pendiente"             // Orden de compra pendiente
  | "expediente_rechazado"     // Expediente rechazado
  | "expediente_aceptado";     // Expediente aceptado

export interface Notification {
  id: string;
  expediente_id: string;
  tipo: NotificationType;
  titulo: string;
  descripcion: string;
  urgencia: "baja" | "media" | "alta" | "critica";
  fecha_creacion: string;
  fecha_vencimiento?: string;
  leida: boolean;
  acciones: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action_type: "ver_expediente" | "marcar_pago" | "editar" | "resolver" | "custom";
  value?: string;
}

export interface PendingExpediente {
  id: string;
  numero: string;
  año: number;
  asunto: string;
  estado: string;
  tipo: string;
  fecha_inicio: string;
  fecha_vencimiento?: string;
  area_responsable: string;
  prioridad: string;
  razon_alerta: string;
  dias_pendiente: number;
}

export interface NotificationStats {
  total_notificaciones: number;
  por_urgencia: {
    critica: number;
    alta: number;
    media: number;
    baja: number;
  };
  por_tipo: {
    [key in NotificationType]: number;
  };
  sin_leer: number;
}

export interface NotificationSummary {
  stats: NotificationStats;
  notificaciones: Notification[];
  expedientes_pendientes: PendingExpediente[];
}
