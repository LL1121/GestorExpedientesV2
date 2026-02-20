import { useState, useEffect } from "react";
import { AlertCircle, Clock, CreditCard, CheckCircle, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import { SkeletonCard, SkeletonSection } from "@/components/Skeleton";

interface Alerta {
  id: string;
  numero: string;
  año: number;
  asunto: string;
  estado: string;
  dias_vencido?: number;
  dias_para_vencer?: number;
  dias_pendiente?: number;
}

interface NotificacionesResponse {
  stats: {
    total: number;
    vencidos: number;
    proximos_vencer: number;
    sin_pagar: number;
    pendientes: number;
    criticos: number;
    por_estado: Record<string, number>;
    por_tipo: Record<string, number>;
  };
  alertas: {
    vencidos: Alerta[];
    proximos_vencer: Alerta[];
    sin_pagar: Alerta[];
    pendientes: Alerta[];
  };
}

interface NotificacionesProps {
  onSelectExpediente?: (expediente: any) => void;
  onNotificationCountChange?: (count: number) => void;
}

// Datos hardcodeados para testing
const MOCK_NOTIFICACIONES: NotificacionesResponse = {
  stats: {
    total: 45,
    vencidos: 3,
    proximos_vencer: 5,
    sin_pagar: 2,
    pendientes: 8,
    criticos: 10,
    por_estado: {
      "Iniciado": 5,
      "EnProceso": 20,
      "EnRevision": 8,
      "Finalizado": 10,
      "Observado": 2
    },
    por_tipo: {
      "InfoGov": 15,
      "Pago": 10,
      "Interno": 12,
      "Gde": 8
    }
  },
  alertas: {
    vencidos: [
      {
        id: "1",
        numero: "EXP-001",
        año: 2026,
        asunto: "Solicitud de compra de materiales de construcción",
        estado: "EnProceso",
        dias_vencido: 5
      },
      {
        id: "2",
        numero: "EXP-002",
        año: 2026,
        asunto: "Resolución de conflicto laboral",
        estado: "Observado",
        dias_vencido: 3
      },
      {
        id: "3",
        numero: "EXP-003",
        año: 2026,
        asunto: "Autorización de gastos especiales",
        estado: "EnProceso",
        dias_vencido: 12
      }
    ],
    proximos_vencer: [
      {
        id: "4",
        numero: "EXP-004",
        año: 2026,
        asunto: "Trámite de licencia municipal",
        estado: "Iniciado",
        dias_para_vencer: 3
      },
      {
        id: "5",
        numero: "EXP-005",
        año: 2026,
        asunto: "Inspección de seguridad",
        estado: "EnProceso",
        dias_para_vencer: 2
      },
      {
        id: "6",
        numero: "EXP-006",
        año: 2026,
        asunto: "Certificación de conformidad",
        estado: "EnRevision",
        dias_para_vencer: 7
      },
      {
        id: "7",
        numero: "EXP-007",
        año: 2026,
        asunto: "Renovación de permisos",
        estado: "Iniciado",
        dias_para_vencer: 1
      },
      {
        id: "8",
        numero: "EXP-008",
        año: 2026,
        asunto: "Aprobación de presupuesto anual",
        estado: "EnProceso",
        dias_para_vencer: 4
      }
    ],
    sin_pagar: [
      {
        id: "9",
        numero: "PAG-001",
        año: 2026,
        asunto: "Orden de compra - Equipos informáticos",
        estado: "EnProceso"
      },
      {
        id: "10",
        numero: "PAG-002",
        año: 2026,
        asunto: "Factura por servicios profesionales",
        estado: "Iniciado"
      }
    ],
    pendientes: [
      {
        id: "11",
        numero: "EXP-009",
        año: 2026,
        asunto: "Evaluación de ofertas de proveedores",
        estado: "Iniciado",
        dias_pendiente: 21
      },
      {
        id: "12",
        numero: "EXP-010",
        año: 2026,
        asunto: "Revisión de documentación técnica",
        estado: "EnProceso",
        dias_pendiente: 18
      },
      {
        id: "13",
        numero: "EXP-011",
        año: 2026,
        asunto: "Coordinación con dependencias",
        estado: "EnProceso",
        dias_pendiente: 15
      },
      {
        id: "14",
        numero: "EXP-012",
        año: 2026,
        asunto: "Preparación de reportes mensuales",
        estado: "Iniciado",
        dias_pendiente: 22
      },
      {
        id: "15",
        numero: "EXP-013",
        año: 2026,
        asunto: "Auditoría de procesos internos",
        estado: "EnProceso",
        dias_pendiente: 16
      },
      {
        id: "16",
        numero: "EXP-014",
        año: 2026,
        asunto: "Validación de sistemas",
        estado: "EnProceso",
        dias_pendiente: 20
      },
      {
        id: "17",
        numero: "EXP-015",
        año: 2026,
        asunto: "Planificación estratégica 2026",
        estado: "Iniciado",
        dias_pendiente: 28
      },
      {
        id: "18",
        numero: "EXP-016",
        año: 2026,
        asunto: "Capacitación del personal",
        estado: "EnProceso",
        dias_pendiente: 19
      }
    ]
  }
};

export default function Notificaciones({ onSelectExpediente, onNotificationCountChange }: NotificacionesProps) {
  const [notificaciones, setNotificaciones] = useState<NotificacionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    vencidos: true,
    proximos_vencer: true,
    sin_pagar: true,
    pendientes: true
  });

  useEffect(() => {
    cargarNotificaciones();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      
      // Simular delay de red de 1.5 segundos para ver el spinner
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Intentar obtener datos reales, si falla usar MOCK
      try {
        const result = await (window as any).__TAURI__?.invoke('get_expedientes_notificaciones') as NotificacionesResponse;
        if (result) {
          setNotificaciones(result);
          onNotificationCountChange?.(result.stats.criticos);
        }
      } catch (err) {
        console.error("Error obteniendo notificaciones reales, usando mock:", err);
        // Si falla, usar datos mock
        setNotificaciones(MOCK_NOTIFICACIONES);
        onNotificationCountChange?.(MOCK_NOTIFICACIONES.stats.criticos);
      }
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      // Si hay error, mostrar notificaciones vacías
      setNotificaciones({
        stats: {
          total: 0,
          vencidos: 0,
          proximos_vencer: 0,
          sin_pagar: 0,
          pendientes: 0,
          criticos: 0,
          por_estado: {},
          por_tipo: {}
        },
        alertas: {
          vencidos: [],
          proximos_vencer: [],
          sin_pagar: [],
          pendientes: []
        }
      });
      onNotificationCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Si aún no hay notificaciones después de cargar, usar estado vacío
  const stats = notificaciones?.stats || {
    total: 0,
    vencidos: 0,
    proximos_vencer: 0,
    sin_pagar: 0,
    pendientes: 0,
    criticos: 0,
    por_estado: {},
    por_tipo: {}
  };
  
  const alertas = notificaciones?.alertas || {
    vencidos: [],
    proximos_vencer: [],
    sin_pagar: [],
    pendientes: []
  };

  const renderAlerta = (alerta: Alerta, tipo: string) => (
    <div
      key={alerta.id}
      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
      onClick={() => onSelectExpediente?.({ id: alerta.id, numero: alerta.numero, año: alerta.año, asunto: alerta.asunto, estado: alerta.estado })}
    >
      <div className="flex-shrink-0 mt-1">
        {tipo === "vencidos" && <AlertCircle className="w-5 h-5 text-red-500" />}
        {tipo === "proximos_vencer" && <Clock className="w-5 h-5 text-orange-500" />}
        {tipo === "sin_pagar" && <CreditCard className="w-5 h-5 text-yellow-500" />}
        {tipo === "pendientes" && <CheckCircle className="w-5 h-5 text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 dark:text-white text-sm">
          {alerta.numero}/{alerta.año}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
          {alerta.asunto}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
            {alerta.estado}
          </span>
          {alerta.dias_vencido && (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              Vencido hace {alerta.dias_vencido} días
            </span>
          )}
          {alerta.dias_para_vencer && (
            <span className="text-orange-600 dark:text-orange-400 font-semibold">
              Vence en {alerta.dias_para_vencer} días
            </span>
          )}
          {alerta.dias_pendiente && (
            <span className="text-blue-600 dark:text-blue-400">
              Pendiente {alerta.dias_pendiente} días
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Botón de refrescar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notificaciones</h2>
        <Button
          onClick={cargarNotificaciones}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Mostrar loader mientras carga */}
      {loading && !notificaciones && (
        <div className="space-y-4">
          <LoadingSpinner size="md" text="Cargando notificaciones..." />
          
          {/* Skeleton de tarjetas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Skeleton de secciones */}
          <div className="space-y-3 mt-6">
            {[...Array(3)].map((_, i) => (
              <SkeletonSection key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Mostrar contenido cuando está listo */}
      {!loading && notificaciones && (
        <>
          {/* Resumen de Alertas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.vencidos}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Vencidos</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.proximos_vencer}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Por Vencer</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.sin_pagar}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Sin Pagar</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.pendientes}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Pendientes</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {stats.criticos}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Críticos</div>
            </div>
          </div>

          {/* Secciones de Alertas */}
          <div className="space-y-3">
        {/* VENCIDOS */}
        {(alertas.vencidos.length > 0 || alertas.proximos_vencer.length > 0) && (
          <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("vencidos")}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-900 dark:text-red-100">
                  ⏰ Expedientes Vencidos ({alertas.vencidos.length})
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-red-600 dark:text-red-400 transition",
                  expandedSections.vencidos && "rotate-180"
                )}
              />
            </button>
            {expandedSections.vencidos && (
              <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-red-200 dark:border-red-800">
                {alertas.vencidos.length > 0 ? (
                  alertas.vencidos.map(alerta => renderAlerta(alerta, "vencidos"))
                ) : (
                  <p className="text-slate-500 text-sm">Sin expedientes vencidos</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRÓXIMOS A VENCER */}
        {alertas.proximos_vencer.length > 0 && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("proximos_vencer")}
              className="w-full flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900 transition"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-900 dark:text-orange-100">
                  ⚠️ Próximos a Vencer ({alertas.proximos_vencer.length})
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-orange-600 dark:text-orange-400 transition",
                  expandedSections.proximos_vencer && "rotate-180"
                )}
              />
            </button>
            {expandedSections.proximos_vencer && (
              <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-orange-200 dark:border-orange-800">
                {alertas.proximos_vencer.map(alerta => renderAlerta(alerta, "proximos_vencer"))}
              </div>
            )}
          </div>
        )}

        {/* SIN PAGAR */}
        {alertas.sin_pagar.length > 0 && (
          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("sin_pagar")}
              className="w-full flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950 hover:bg-yellow-100 dark:hover:bg-yellow-900 transition"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                  💳 Expedientes de Pago ({alertas.sin_pagar.length})
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-yellow-600 dark:text-yellow-400 transition",
                  expandedSections.sin_pagar && "rotate-180"
                )}
              />
            </button>
            {expandedSections.sin_pagar && (
              <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-yellow-200 dark:border-yellow-800">
                {alertas.sin_pagar.map(alerta => renderAlerta(alerta, "sin_pagar"))}
              </div>
            )}
          </div>
        )}

        {/* PENDIENTES */}
        {alertas.pendientes.length > 0 && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("pendientes")}
              className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  📋 Expedientes Pendientes ({alertas.pendientes.length})
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-blue-600 dark:text-blue-400 transition",
                  expandedSections.pendientes && "rotate-180"
                )}
              />
            </button>
            {expandedSections.pendientes && (
              <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-blue-200 dark:border-blue-800">
                {alertas.pendientes.map(alerta => renderAlerta(alerta, "pendientes"))}
              </div>
            )}
          </div>
        )}
          </div>

          {/* Sin alertas */}
          {stats.criticos === 0 && (
            <div className="text-center py-12 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-3" />
              <p className="text-green-900 dark:text-green-100 font-semibold">¡Todo al día!</p>
              <p className="text-green-700 dark:text-green-300 text-sm">No hay expedientes que requieran atención</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
