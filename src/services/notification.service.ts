// Servicio para detectar y gestionar notificaciones de expedientes

import type { 
  Expediente
} from "@/types/expediente";
import type { 
  Notification, 
  NotificationType, 
  PendingExpediente,
  NotificationStats,
  NotificationSummary
} from "@/types/notifications";

export class ExpedienteNotificationService {
  /**
   * Analiza expedientes y genera notificaciones
   */
  static generarNotificaciones(expedientes: Expediente[]): NotificationSummary {
    const notificaciones: Notification[] = [];
    const expedientes_pendientes: PendingExpediente[] = [];
    
    const hoy = new Date();
    
    expedientes.forEach((exp) => {
      const alertas = this.detectarAlertas(exp, hoy);
      
      alertas.forEach((alerta) => {
        const notification = this.crearNotificacion(exp, alerta);
        notificaciones.push(notification);
        
        // Agregar a expedientes pendientes si es relevante
        if (alerta.tipo_alerta === "pendiente_contestar" || 
            alerta.tipo_alerta === "pago_sin_pagar" ||
            alerta.tipo_alerta === "expediente_vencido") {
          expedientes_pendientes.push(this.crearPendingExpediente(exp, alerta));
        }
      });
    });

    return {
      stats: this.calcularEstadisticas(notificaciones),
      notificaciones: notificaciones.sort((a, b) => 
        this.prioridadUrgencia(b.urgencia) - this.prioridadUrgencia(a.urgencia)
      ),
      expedientes_pendientes
    };
  }

  /**
   * Detecta alertas para un expediente específico
   */
  private static detectarAlertas(exp: Expediente, hoy: Date): Array<{
    tipo_alerta: NotificationType;
    urgencia: "baja" | "media" | "alta" | "critica";
    razon: string;
    dias_pendiente?: number;
  }> {
    const alertas: Array<{
      tipo_alerta: NotificationType;
      urgencia: "baja" | "media" | "alta" | "critica";
      razon: string;
      dias_pendiente?: number;
    }> = [];

    // 🔴 CRITICA: Expediente vencido
    if (exp.fecha_vencimiento) {
      const fecha_venc = new Date(exp.fecha_vencimiento);
      const dias_diff = Math.floor((fecha_venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dias_diff < 0) {
        alertas.push({
          tipo_alerta: "expediente_vencido",
          urgencia: "critica",
          razon: `Expediente vencido hace ${Math.abs(dias_diff)} días`,
          dias_pendiente: Math.abs(dias_diff)
        });
      } else if (dias_diff <= 7 && dias_diff > 0) {
        // 🟠 ALTA: Próximo a vencer (1 semana)
        alertas.push({
          tipo_alerta: "proximo_vencer",
          urgencia: "alta",
          razon: `Vence en ${dias_diff} días`,
          dias_pendiente: dias_diff
        });
      }
    }

    // 🟡 MEDIA: Expediente pendiente de contestar
    if (["INICIADO", "EN_PROCESO", "PENDIENTE"].includes(exp.estado?.toUpperCase() || "")) {
      // Calcular días pendiente desde fecha_inicio
      const fecha_inicio = new Date(exp.fecha_inicio);
      const dias_pendiente = Math.floor((hoy.getTime() - fecha_inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dias_pendiente > 14) {
        alertas.push({
          tipo_alerta: "pendiente_contestar",
          urgencia: dias_pendiente > 30 ? "alta" : "media",
          razon: `Expediente pendiente hace ${dias_pendiente} días`,
          dias_pendiente
        });
      }
    }

    // 🟡 MEDIA: Expediente de pago sin pagar
    if (exp.tipo?.toUpperCase() === "PAGO" && exp.estado?.toUpperCase() !== "PAGADO") {
      alertas.push({
        tipo_alerta: "pago_sin_pagar",
        urgencia: "media",
        razon: "Expediente de pago requiere procesamiento de pago",
      });
    }

    // 🟢 BAJA: Sin revisar (verificar si tiene observaciones vacías)
    if (!exp.observaciones && ["INICIADO"].includes(exp.estado?.toUpperCase() || "")) {
      alertas.push({
        tipo_alerta: "sin_revisar",
        urgencia: "baja",
        razon: "Expediente sin revisar",
      });
    }

    // 🟠 ALTA: Expediente rechazado (requiere acción)
    if (exp.estado?.toUpperCase() === "RECHAZADO") {
      alertas.push({
        tipo_alerta: "expediente_rechazado",
        urgencia: "alta",
        razon: "Expediente rechazado - requiere corrección y reenvío",
      });
    }

    return alertas;
  }

  /**
   * Crea una notificación a partir de una alerta
   */
  private static crearNotificacion(
    exp: Expediente,
    alerta: {
      tipo_alerta: NotificationType;
      urgencia: "baja" | "media" | "alta" | "critica";
      razon: string;
    }
  ): Notification {
    const titulos: Record<NotificationType, string> = {
      pendiente_contestar: "📋 Expediente Pendiente",
      pago_sin_pagar: "💳 Pago Pendiente",
      expediente_vencido: "⏰ Expediente Vencido",
      proximo_vencer: "⚠️ Próximo a Vencer",
      sin_revisar: "👁️ Sin Revisar",
      accion_requerida: "🔔 Acción Requerida",
      oc_pendiente: "📦 OC Pendiente",
      expediente_rechazado: "❌ Expediente Rechazado",
      expediente_aceptado: "✅ Expediente Aceptado"
    };

    return {
      id: `notif_${exp.id}_${Date.now()}`,
      expediente_id: exp.id,
      tipo: alerta.tipo_alerta,
      titulo: titulos[alerta.tipo_alerta],
      descripcion: `${exp.numero}/${exp.año} - ${exp.asunto} - ${alerta.razon}`,
      urgencia: alerta.urgencia,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: exp.fecha_vencimiento ?? undefined,
      leida: false,
      acciones: [
        {
          label: "Ver Expediente",
          action_type: "ver_expediente",
          value: exp.id
        },
        {
          label: "Editar",
          action_type: "editar",
          value: exp.id
        }
      ]
    };
  }

  /**
   * Crea expediente pendiente para lista
   */
  private static crearPendingExpediente(
    exp: Expediente,
    alerta: {
      tipo_alerta: NotificationType;
      razon: string;
      dias_pendiente?: number;
    }
  ): PendingExpediente {
    return {
      id: exp.id,
      numero: exp.numero,
      año: exp.año,
      asunto: exp.asunto,
      estado: exp.estado,
      tipo: exp.tipo,
      fecha_inicio: exp.fecha_inicio,
      fecha_vencimiento: exp.fecha_vencimiento ?? undefined,
      area_responsable: exp.area_responsable,
      prioridad: exp.prioridad,
      razon_alerta: alerta.razon,
      dias_pendiente: alerta.dias_pendiente || 0
    };
  }

  /**
   * Calcula estadísticas de notificaciones
   */
  private static calcularEstadisticas(notificaciones: Notification[]): NotificationStats {
    const tipos: NotificationType[] = [
      "pendiente_contestar",
      "pago_sin_pagar",
      "expediente_vencido",
      "proximo_vencer",
      "sin_revisar",
      "accion_requerida",
      "oc_pendiente",
      "expediente_rechazado",
      "expediente_aceptado"
    ];

    const porTipo = tipos.reduce((acc, tipo) => {
      acc[tipo] = 0;
      return acc;
    }, {} as Record<NotificationType, number>);

    const stats: NotificationStats = {
      total_notificaciones: notificaciones.length,
      por_urgencia: {
        critica: 0,
        alta: 0,
        media: 0,
        baja: 0
      },
      por_tipo: porTipo,
      sin_leer: notificaciones.filter(n => !n.leida).length
    };

    // Contar por urgencia y tipo
    notificaciones.forEach(notif => {
      stats.por_urgencia[notif.urgencia]++;
      stats.por_tipo[notif.tipo]++;
    });

    return stats;
  }

  /**
   * Convierte urgencia a número para ordenamiento
   */
  private static prioridadUrgencia(urgencia: string): number {
    const prioridades = {
      "critica": 4,
      "alta": 3,
      "media": 2,
      "baja": 1
    };
    return prioridades[urgencia as keyof typeof prioridades] || 0;
  }

  /**
   * Filtra notificaciones por tipo
   */
  static filtrarPorTipo(notificaciones: Notification[], tipo: NotificationType): Notification[] {
    return notificaciones.filter(n => n.tipo === tipo);
  }

  /**
   * Filtra notificaciones por urgencia
   */
  static filtrarPorUrgencia(notificaciones: Notification[], urgencia: string): Notification[] {
    return notificaciones.filter(n => n.urgencia === urgencia);
  }

  /**
   * Cuenta expedientes críticos
   */
  static contarCriticos(notificaciones: Notification[]): number {
    return notificaciones.filter(n => n.urgencia === "critica" || n.urgencia === "alta").length;
  }

  /**
   * Obtiene color para urgencia
   */
  static getColorUrgencia(urgencia: string): string {
    const colores = {
      "critica": "bg-red-500 text-white",
      "alta": "bg-orange-500 text-white",
      "media": "bg-yellow-500 text-white",
      "baja": "bg-blue-500 text-white"
    };
    return colores[urgencia as keyof typeof colores] || "bg-gray-500 text-white";
  }

  /**
   * Obtiene icono para tipo de notificación
   */
  static getIconoTipo(tipo: NotificationType): string {
    const iconos = {
      "pendiente_contestar": "📋",
      "pago_sin_pagar": "💳",
      "expediente_vencido": "⏰",
      "proximo_vencer": "⚠️",
      "sin_revisar": "👁️",
      "accion_requerida": "🔔",
      "oc_pendiente": "📦",
      "expediente_rechazado": "❌",
      "expediente_aceptado": "✅"
    };
    return iconos[tipo] || "📌";
  }
}
