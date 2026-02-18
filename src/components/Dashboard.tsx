import { useState, useEffect, type ElementType, type MouseEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  Search,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  MoreVertical,
  Menu,
  Wifi,
  WifiOff,
  Filter,
  Edit,
  Trash2,
  Download,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  FileSpreadsheet,
  Truck,
  Users,
  ChevronDown,
  Copy,
  Calendar,
  Building2,
  MapPin,
  User,
  CreditCard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExpedienteService } from "@/services/expediente.service";
import type { Expediente, EstadoExpediente, TipoExpediente, Prioridad, CreateExpedienteInput } from "@/types/expediente";
import type { NuevaOCPreparada } from "@/types/orden_compra";
import { OrdenCompraService } from "@/services/orden_compra.service";
import Movilidades from "@/components/Movilidades";
import Personal from "@/components/Personal";
import FormularioOC from "@/components/FormularioOC";
import PreviewOC from "@/components/PreviewOC";
import ConfigTopes from "@/components/ConfigTopes";

type FilterType = "all" | EstadoExpediente | "InfoGov" | "Gde" | "Interno" | "Otro";
type ActiveView = "dashboard" | "analiticas" | "configuracion" | "movilidades" | "personal" | "formulario-oc" | "preview-oc";

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Expediente | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isOnline] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [ocDraft, setOcDraft] = useState<NuevaOCPreparada | null>(null);
  const [ocRenglones, setOcRenglones] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerationStatus, setPdfGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newExpediente, setNewExpediente] = useState<Partial<CreateExpedienteInput> & { estado?: EstadoExpediente }>({
    prioridad: "Media",
    fecha_inicio: new Date().toISOString().split('T')[0],
  });
  const [configTab, setConfigTab] = useState<"general" | "notifications" | "about" | "oc">("general");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    items: { label: string; icon?: ElementType; onClick: () => void; danger?: boolean }[];
  }>({ visible: false, x: 0, y: 0, items: [] });

  const formatError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err) {
      return String((err as { message?: unknown }).message);
    }
    try {
      return JSON.stringify(err);
    } catch {
      return "Error desconocido";
    }
  };

  // Cargar expedientes al montar el componente
  useEffect(() => {
    loadExpedientes();
  }, []);

  // Persistir modo oscuro
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Capturar errores globales
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setError(formatError(event.error || event.message));
    };

    const onUnhandled = (event: PromiseRejectionEvent) => {
      setError(formatError(event.reason));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  const loadExpedientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ExpedienteService.getAll();
      setExpedientes(data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpediente = async () => {
    try {
      if (!newExpediente.numero || !newExpediente.año || !newExpediente.tipo || !newExpediente.asunto || !newExpediente.area_responsable) {
        alert("Por favor completa los campos requeridos");
        return;
      }

      await ExpedienteService.create(newExpediente as CreateExpedienteInput);
      setIsAddDialogOpen(false);
      setNewExpediente({
        prioridad: "Media",
        fecha_inicio: new Date().toISOString().split('T')[0],
      });
      await loadExpedientes();
    } catch (err) {
      alert("Error al crear expediente: " + formatError(err));
    }
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
  };

  const handleGenerarOC = async (expediente: Expediente) => {
    try {
      const prepared = await OrdenCompraService.prepararNuevaOC(expediente.id);
      setOcDraft(prepared);
      setOcRenglones([
        { cantidad: 0, detalle: "", marca: "", valor_unitario: 0 },
      ]);
      setSelectedRecord(null);
      setActiveView("preview-oc");
    } catch (err) {
      const errorMessage = formatError(err);
      console.error("Error al preparar OC:", err);
      setError(`Error al preparar OC: ${errorMessage}`);
    }
  };

  const filterOptions: { label: string; value: FilterType; count: number }[] = [
    { label: "Todos", value: "all", count: expedientes.length },
    { label: "Iniciado", value: "Iniciado", count: expedientes.filter((r) => r.estado === "Iniciado").length },
    { label: "En Proceso", value: "EnProceso", count: expedientes.filter((r) => r.estado === "EnProceso").length },
    { label: "Finalizado", value: "Finalizado", count: expedientes.filter((r) => r.estado === "Finalizado").length },
    { label: "InfoGov", value: "InfoGov", count: expedientes.filter((r) => r.tipo === "InfoGov").length },
    { label: "GDE", value: "Gde", count: expedientes.filter((r) => r.tipo === "Gde").length },
  ];

  const filteredRecords = expedientes.filter((record) => {
    const matchesSearch =
      searchQuery === "" ||
      record.asunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.numero.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === "all" || record.estado === activeFilter || record.tipo === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: EstadoExpediente) => {
    switch (status) {
      case "Iniciado":
        return "bg-blue-500";
      case "EnProceso":
        return "bg-amber-500";
      case "Archivado":
        return "bg-slate-400";
      case "Finalizado":
        return "bg-emerald-500";
      case "EnRevision":
        return "bg-purple-500";
      case "Observado":
        return "bg-red-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStatusLabel = (status: EstadoExpediente) => {
    const labels: Record<EstadoExpediente, string> = {
      Iniciado: "Iniciado",
      EnProceso: "En Proceso",
      EnRevision: "En Revisión",
      Observado: "Observado",
      Finalizado: "Finalizado",
      Archivado: "Archivado",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const openContextMenu = (
    e: MouseEvent,
    items: { label: string; icon?: ElementType; onClick: () => void; danger?: boolean }[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 240;
    const menuHeight = Math.max(120, items.length * 40);
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
    setContextMenu({ visible: true, x, y, items });
  };

  return (
    <div
      className="flex h-screen bg-slate-50 dark:bg-slate-900"
      onContextMenu={(e) =>
        openContextMenu(e, [
          {
            label: "Nuevo expediente",
            icon: Plus,
            onClick: () => {
              setIsAddDialogOpen(true);
              closeContextMenu();
            },
          },
          {
            label: "Actualizar",
            icon: RefreshCw,
            onClick: () => {
              loadExpedientes();
              closeContextMenu();
            },
          },
        ])
      }
    >
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-2xl max-h-96 overflow-y-auto rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-semibold">Error</p>
              <pre className="break-words whitespace-pre-wrap font-mono text-xs">{error}</pre>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="flex-shrink-0">
              Cerrar
            </Button>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {!sidebarCollapsed && (
            <img 
              src="/irrigacion-negro.png" 
              alt="Irrigación" 
              className="h-10 w-auto object-contain dark:invert mr-3 mb-1" 
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" as ActiveView },
            { icon: Truck, label: "Movilidades", view: "movilidades" as ActiveView },
            { icon: Users, label: "Personal", view: "personal" as ActiveView },
            { icon: BarChart3, label: "Analíticas", view: "analiticas" as ActiveView },
            { icon: Settings, label: "Configuración", view: "configuracion" as ActiveView },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleViewChange(item.view)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                activeView === item.view ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sync Status */}
        <div className={cn("p-4 border-t border-slate-200", sidebarCollapsed && "px-2")}>
          <div className={cn("flex items-center gap-2 text-xs", sidebarCollapsed ? "justify-center" : "")}>
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                {!sidebarCollapsed && <span className="text-slate-600">En línea</span>}
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-slate-400" />
                {!sidebarCollapsed && <span className="text-slate-600">Sin conexión</span>}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Search - Solo visible en Dashboard */}
        {activeView === "dashboard" && (
          <header className="h-32 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col justify-center px-8">
            <div className="max-w-2xl mx-auto w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar expedientes... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 text-base border-slate-200 focus-visible:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
          </header>
        )}

        {/* Filter Bar - Solo visible en Dashboard */}
        {activeView === "dashboard" && (
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Filtros con scroll */}
              <div className="flex items-center gap-3 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: 'thin' }}>
                <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setActiveFilter(option.value)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                      activeFilter === option.value
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    )}
                  >
                    {option.label}
                    <span className="ml-2 text-xs opacity-70">({option.count})</span>
                  </button>
                ))}
              </div>

              {/* Flecha a la derecha */}
              <div className="shrink-0">
                {/* Menú Desplegable de Acciones */}
                <DropdownMenu onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <ChevronDown className={cn(
                        "h-5 w-5 text-blue-600 dark:text-blue-400 transition-all duration-300",
                        isDropdownOpen && "rotate-180"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 bg-white dark:bg-slate-800 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                  >
                    <DropdownMenuItem
                      onClick={() => setIsAddDialogOpen(true)}
                      className="cursor-pointer py-3 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Añadir Expediente</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await invoke("exportar_excel_pendientes");
                          alert("Informe exportado exitosamente");
                        } catch (error) {
                          alert("Error al exportar: " + error);
                        }
                      }}
                      className="cursor-pointer py-3 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 transition-colors duration-200"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">Exportar Informe Automático</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 overflow-auto px-8 py-6 mt-8">
          {activeView === "dashboard" && (
            loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Cargando expedientes...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <Button onClick={loadExpedientes}>Reintentar</Button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No se encontraron expedientes</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  No hay expedientes que coincidan con tu búsqueda o filtro. Intenta ajustar los criterios.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ID Expediente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Asunto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Última Actualización
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Área
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className={cn("transition-colors cursor-pointer", hoveredRow === record.id ? "bg-slate-50" : "")}
                      onMouseEnter={() => setHoveredRow(record.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setSelectedRecord(record)}
                      onContextMenu={(e) =>
                        openContextMenu(e, [
                          {
                            label: "Ver detalles",
                            icon: FileText,
                            onClick: () => {
                              setSelectedRecord(record);
                              closeContextMenu();
                            },
                          },
                          ...(record.tipo === "Pago"
                            ? [
                                {
                                  label: "Generar Orden de Compra",
                                  icon: FileSpreadsheet,
                                  onClick: () => {
                                    handleGenerarOC(record);
                                    closeContextMenu();
                                  },
                                },
                              ]
                            : []),
                          {
                            label: "Copiar N° expediente",
                            icon: Copy,
                            onClick: () => {
                              navigator.clipboard?.writeText(`${record.numero}-${record.año}`);
                              closeContextMenu();
                            },
                          },
                          {
                            label: "Editar",
                            icon: Edit,
                            onClick: () => {
                              alert("Edición - Próximamente disponible");
                              closeContextMenu();
                            },
                          },
                          {
                            label: "Eliminar",
                            icon: Trash2,
                            danger: true,
                            onClick: async () => {
                              closeContextMenu();
                              if (confirm(`¿Eliminar expediente ${record.numero}-${record.año}?`)) {
                                try {
                                  await ExpedienteService.delete(record.id);
                                  await loadExpedientes();
                                } catch (err) {
                                  alert("Error al eliminar: " + err);
                                }
                              }
                            },
                          },
                        ])
                      }
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(record.estado))} />
                          <span className="text-xs font-medium text-slate-600">{getStatusLabel(record.estado)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono text-slate-900 dark:text-white">
                          {record.numero}-{record.año}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-slate-900 line-clamp-1">{record.asunto}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={record.tipo === "InfoGov" || record.tipo === "Gde" ? "default" : "secondary"} className="text-xs">
                          {record.tipo}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">{formatDate(record.updated_at)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">{record.area_responsable}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                alert("Edición - Próximamente disponible");
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                alert("Descarga - Próximamente disponible");
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`¿Eliminar expediente ${record.numero}-${record.año}?`)) {
                                  try {
                                    await ExpedienteService.delete(record.id);
                                    await loadExpedientes();
                                  } catch (err) {
                                    alert("Error al eliminar: " + err);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ))
          }

          {/* Vista: Movilidades */}
          {activeView === "movilidades" && <Movilidades />}

          {/* Vista: Personal */}
          {activeView === "personal" && <Personal />}

          {/* Vista: Analíticas */}
          {activeView === "analiticas" && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analíticas y Reportes</h2>
                <p className="text-sm text-slate-600 mt-1">Métricas y estadísticas del sistema</p>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-90">Total Expedientes</p>
                    <FileText className="h-5 w-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold">{expedientes.length}</p>
                  <p className="text-xs opacity-75 mt-2">Todos los registros</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-90">Finalizados</p>
                    <CheckCircle className="h-5 w-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold">{expedientes.filter(e => e.estado === "Finalizado").length}</p>
                  <p className="text-xs opacity-75 mt-2">
                    {expedientes.length > 0 ? Math.round((expedientes.filter(e => e.estado === "Finalizado").length / expedientes.length) * 100) : 0}% del total
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-90">En Proceso</p>
                    <Clock className="h-5 w-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold">{expedientes.filter(e => e.estado === "EnProceso").length}</p>
                  <p className="text-xs opacity-75 mt-2">Activos actualmente</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-90">Observados</p>
                    <AlertCircle className="h-5 w-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold">{expedientes.filter(e => e.estado === "Observado").length}</p>
                  <p className="text-xs opacity-75 mt-2">Requieren atención</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estado Distribution */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Estado</h3>
                  <div className="space-y-3">
                    {[
                      { estado: "Iniciado", color: "bg-blue-500", count: expedientes.filter(e => e.estado === "Iniciado").length },
                      { estado: "En Proceso", color: "bg-amber-500", count: expedientes.filter(e => e.estado === "EnProceso").length },
                      { estado: "En Revisión", color: "bg-purple-500", count: expedientes.filter(e => e.estado === "EnRevision").length },
                      { estado: "Observado", color: "bg-red-500", count: expedientes.filter(e => e.estado === "Observado").length },
                      { estado: "Finalizado", color: "bg-emerald-500", count: expedientes.filter(e => e.estado === "Finalizado").length },
                    ].map((item) => (
                      <div key={item.estado} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{item.estado}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.count}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`${item.color} h-2 rounded-full transition-all`}
                              style={{ width: `${expedientes.length > 0 ? (item.count / expedientes.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipo Distribution */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Tipo</h3>
                  <div className="space-y-4">
                    {[
                      { tipo: "InfoGov", label: "Info Gubernamental", count: expedientes.filter(e => e.tipo === "InfoGov").length },
                      { tipo: "Gde", label: "GDE", count: expedientes.filter(e => e.tipo === "Gde").length },
                      { tipo: "Interno", label: "Interno", count: expedientes.filter(e => e.tipo === "Interno").length },
                      { tipo: "Otro", label: "Otro", count: expedientes.filter(e => e.tipo === "Otro").length },
                    ].map((item) => (
                      <div key={item.tipo} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{item.count}</span>
                          <span className="text-xs text-slate-500">
                            ({expedientes.length > 0 ? Math.round((item.count / expedientes.length) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance by Area */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Rendimiento por Área</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Área</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Total</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">En Proceso</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Finalizados</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Eficiencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from(new Set(expedientes.map(e => e.area_responsable))).map((area) => {
                        const areaExp = expedientes.filter(e => e.area_responsable === area);
                        const finalizados = areaExp.filter(e => e.estado === "Finalizado").length;
                        const eficiencia = areaExp.length > 0 ? Math.round((finalizados / areaExp.length) * 100) : 0;
                        return (
                          <tr key={area} className="hover:bg-slate-50 dark:bg-slate-700">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{area}</td>
                            <td className="py-3 px-4 text-sm text-center text-slate-600">{areaExp.length}</td>
                            <td className="py-3 px-4 text-sm text-center text-slate-600">
                              {areaExp.filter(e => e.estado === "EnProceso").length}
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-slate-600">{finalizados}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1">
                                <span className={`text-sm font-semibold ${eficiencia >= 70 ? 'text-emerald-600' : eficiencia >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {eficiencia}%
                                </span>
                                {eficiencia >= 70 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Vista: Formulario OC */}
          {activeView === "formulario-oc" && ocDraft && (
            <FormularioOC
              data={ocDraft}
              onBack={() => {
                setOcDraft(null);
                setOcRenglones([]);
                setActiveView("dashboard");
              }}
              onPreview={(renglones) => {
                setOcRenglones(renglones);
                setActiveView("preview-oc");
              }}
            />
          )}

          {/* Vista: Preview OC */}
          {activeView === "preview-oc" && ocDraft && (
            <PreviewOC
              data={ocDraft}
              renglones={ocRenglones}
              isGenerating={isGeneratingPDF}
              generationStatus={pdfGenerationStatus}
              onBack={() => {
                setActiveView("formulario-oc");
                setPdfGenerationStatus('idle');
              }}
              onGenerateExcel={async (editedData) => {
                try {
                  if (!ocDraft) return;
                  if (isGeneratingPDF) return;
                  setIsGeneratingPDF(true);
                  setPdfGenerationStatus('loading');

                  const excelRequest = {
                    numero_oc: editedData.numeroOC,
                    pedido_nro: editedData.pedidoNro,
                    destino: editedData.destino,
                    fecha: editedData.fecha,
                    expediente_numero: ocDraft.expediente.numero,
                    expediente_año: ocDraft.expediente.año,
                    nro_gde: ocDraft.expediente.nro_gde,
                    nro_infogov: ocDraft.expediente.nro_infogov,
                    resolucion_nro: ocDraft.expediente.resolucion_nro,
                    tipo_contratacion: ocDraft.tipo_contratacion,
                    señor: editedData.señor,
                    domicilio: editedData.domicilio,
                    cuit: editedData.cuit,
                    descripcion_zona: editedData.descripcionZona,
                    renglones: editedData.renglones.map((r: any, idx: number) => ({
                      numero: idx + 1,
                      cantidad: r.cantidad,
                      concepto: r.detalle,
                      marca: r.marca || null,
                      valor_unitario: r.valor_unitario,
                      total: r.cantidad * r.valor_unitario,
                    })),
                    subtotal: editedData.subtotal,
                    iva: editedData.iva,
                    total: editedData.total,
                    total_en_letras: ocDraft.total_en_letras,
                    forma_pago: editedData.formaPago,
                    plazo_entrega: editedData.plazoEntrega,
                    es_iva_inscripto: ocDraft.es_iva_inscripto,
                  };

                  const excelPath = await invoke<string>('generar_excel', { data: excelRequest });
                  await openPath(excelPath);
                  setPdfGenerationStatus('success');

                  setTimeout(() => {
                    setActiveView("dashboard");
                    setOcDraft(null);
                    setOcRenglones([]);
                    setPdfGenerationStatus('idle');
                  }, 1500);
                } catch (err) {
                  console.error("Error al generar Excel:", err);
                  setPdfGenerationStatus('error');
                  const errorMsg = formatError(err);
                  setError(`Error al generar Excel: ${errorMsg}`);

                  setTimeout(() => {
                    setPdfGenerationStatus('idle');
                  }, 3000);
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
              onGeneratePDF={async (editedData) => {
                try {
                  if (!ocDraft) return;
                  if (isGeneratingPDF) return;
                  setIsGeneratingPDF(true);
                  setPdfGenerationStatus('loading');
                  
                  const pdfRequest = {
                    numero_oc: editedData.numeroOC,
                    pedido_nro: editedData.pedidoNro,
                    destino: editedData.destino,
                    fecha: editedData.fecha,
                    expediente_numero: ocDraft.expediente.numero,
                    expediente_año: ocDraft.expediente.año,
                    nro_gde: ocDraft.expediente.nro_gde,
                    nro_infogov: ocDraft.expediente.nro_infogov,
                    resolucion_nro: ocDraft.expediente.resolucion_nro,
                    tipo_contratacion: ocDraft.tipo_contratacion,
                    señor: editedData.señor,
                    domicilio: editedData.domicilio,
                    cuit: editedData.cuit,
                    descripcion_zona: editedData.descripcionZona,
                    renglones: editedData.renglones.map((r: any, idx: number) => ({
                      numero: idx + 1,
                      cantidad: r.cantidad,
                      concepto: r.detalle,
                      marca: r.marca || null,
                      valor_unitario: r.valor_unitario,
                      total: r.cantidad * r.valor_unitario,
                    })),
                    subtotal: editedData.subtotal,
                    iva: editedData.iva,
                    total: editedData.total,
                    total_en_letras: ocDraft.total_en_letras,
                    forma_pago: editedData.formaPago,
                    plazo_entrega: editedData.plazoEntrega,
                    es_iva_inscripto: ocDraft.es_iva_inscripto,
                  };
                  
                  const pdfPath = await invoke<string>('generar_pdf', { data: pdfRequest });
                  await openPath(pdfPath);
                  setPdfGenerationStatus('success');
                  
                  // Volver al dashboard inmediatamente después del éxito
                  setTimeout(() => {
                    setActiveView("dashboard");
                    setOcDraft(null);
                    setOcRenglones([]);
                    setPdfGenerationStatus('idle');
                  }, 1500);  // Breve delay para que el usuario vea el estado de éxito
                } catch (err) {
                  console.error("Error al generar PDF:", err);
                  setPdfGenerationStatus('error');
                  const errorMsg = formatError(err);
                  setError(`Error al generar PDF: ${errorMsg}`);
                  
                  // Volver a idle después de 3 segundos en caso de error
                  setTimeout(() => {
                    setPdfGenerationStatus('idle');
                  }, 3000);
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
            />
          )}

          {/* Vista: Configuración */}
          {activeView === "configuracion" && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h2>
                <p className="text-sm text-slate-600 mt-1">Preferencias y ajustes del sistema</p>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200">
                <div className="flex gap-4">
                  {[
                    { id: "general", label: "General", icon: Settings },
                    { id: "notifications", label: "Notificaciones", icon: Bell },
                    { id: "about", label: "Acerca de", icon: FileText },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setConfigTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        configTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      )}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                {/* General Tab */}
                {configTab === "general" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Apariencia</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">Modo Oscuro</p>
                            <p className="text-sm text-slate-600">Cambiar entre tema claro y oscuro</p>
                          </div>
                          <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              darkMode ? "bg-blue-600" : "bg-slate-300"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                darkMode ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Idioma y Región</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Idioma</Label>
                          <Select defaultValue="es">
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800">
                              <SelectItem value="es" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Español</SelectItem>
                              <SelectItem value="en" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Formato de Fecha</Label>
                          <Select defaultValue="dd/mm/yyyy">
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800">
                              <SelectItem value="dd/mm/yyyy" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">DD/MM/YYYY</SelectItem>
                              <SelectItem value="mm/dd/yyyy" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">MM/DD/YYYY</SelectItem>
                              <SelectItem value="yyyy-mm-dd" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {configTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Preferencias de Notificaciones</h3>
                      <div className="space-y-3">
                        {[
                          { label: "Nuevos expedientes", description: "Notificar cuando se cree un nuevo expediente" },
                          { label: "Cambios de estado", description: "Alertar cuando un expediente cambie de estado" },
                          { label: "Expedientes observados", description: "Avisar cuando un expediente sea marcado como observado" },
                          { label: "Expedientes por vencer", description: "Recordar expedientes próximos a su fecha de vencimiento" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                              <p className="text-sm text-slate-600">{item.description}</p>
                            </div>
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {configTab === "oc" && (
                  <ConfigTopes />
                )}

                {/* About Tab */}
                {configTab === "about" && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Gestor de Irrigación</h3>
                      <p className="text-slate-600 mb-4">Sistema de Gestión de Expedientes</p>
                      <Badge variant="secondary">Versión 0.1.0</Badge>
                    </div>

                    <div className="border-t border-slate-200 pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Frontend</p>
                          <p className="font-medium text-slate-900 dark:text-white">React 19.1 + TypeScript</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Backend</p>
                          <p className="font-medium text-slate-900 dark:text-white">Rust + Tauri 2.x</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Base de Datos</p>
                          <p className="font-medium text-slate-900 dark:text-white">SQLite + PostgreSQL</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Framework UI</p>
                          <p className="font-medium text-slate-900 dark:text-white">Tailwind CSS + shadcn/ui</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <p className="text-xs text-slate-500 text-center">
                        © 2026 Jefatura de Zona de Riego. Todos los derechos reservados.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Añadir Expediente */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Nuevo Expediente</DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo expediente. Los campos con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Fila 1: Número y Año */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  placeholder="Ej: 0001"
                  value={newExpediente.numero || ""}
                  onChange={(e) => setNewExpediente({ ...newExpediente, numero: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="año">Año *</Label>
                <Input
                  id="año"
                  type="number"
                  placeholder="2026"
                  value={newExpediente.año || ""}
                  onChange={(e) => setNewExpediente({ ...newExpediente, año: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Fila 2: Tipo y Prioridad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={newExpediente.tipo}
                  onValueChange={(value) => setNewExpediente({ ...newExpediente, tipo: value as TipoExpediente })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    <SelectItem value="InfoGov" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">InfoGov</SelectItem>
                    <SelectItem value="Gde" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">GDE</SelectItem>
                    <SelectItem value="Interno" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Interno</SelectItem>
                    <SelectItem value="Pago" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Pago</SelectItem>
                    <SelectItem value="Otro" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={newExpediente.prioridad}
                  onValueChange={(value) => setNewExpediente({ ...newExpediente, prioridad: value as Prioridad })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    <SelectItem value="Baja" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Baja</SelectItem>
                    <SelectItem value="Media" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Media</SelectItem>
                    <SelectItem value="Alta" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Alta</SelectItem>
                    <SelectItem value="Urgente" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto *</Label>
              <Input
                id="asunto"
                placeholder="Descripción breve del expediente"
                value={newExpediente.asunto || ""}
                onChange={(e) => setNewExpediente({ ...newExpediente, asunto: e.target.value })}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Detalles adicionales del expediente..."
                rows={3}
                value={newExpediente.descripcion || ""}
                onChange={(e) => setNewExpediente({ ...newExpediente, descripcion: e.target.value })}
              />
            </div>

            {/* Área Responsable y Fecha de Inicio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área Responsable *</Label>
                <Input
                  id="area"
                  placeholder="Ej: Administración"
                  value={newExpediente.area_responsable || ""}
                  onChange={(e) => setNewExpediente({ ...newExpediente, area_responsable: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={newExpediente.fecha_inicio || ""}
                  onChange={(e) => setNewExpediente({ ...newExpediente, fecha_inicio: e.target.value })}
                />
              </div>
            </div>

            {/* Campos específicos para expedientes de tipo "Pago" */}
            {newExpediente.tipo === "Pago" && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-700">Datos para Orden de Compra</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="oc_señor">Señor/es</Label>
                  <Input
                    id="oc_señor"
                    placeholder="Nombre del proveedor o destinatario"
                    className="bg-slate-50"
                    value={newExpediente.oc_señor || ""}
                    onChange={(e) => setNewExpediente({ ...newExpediente, oc_señor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oc_domicilio">Domicilio</Label>
                  <Input
                    id="oc_domicilio"
                    placeholder="Dirección del proveedor"
                    className="bg-slate-50"
                    value={newExpediente.oc_domicilio || ""}
                    onChange={(e) => setNewExpediente({ ...newExpediente, oc_domicilio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oc_cuit">CUIT</Label>
                  <Input
                    id="oc_cuit"
                    placeholder="CUIT del proveedor"
                    className="bg-slate-50"
                    value={newExpediente.oc_cuit || ""}
                    onChange={(e) => setNewExpediente({ ...newExpediente, oc_cuit: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oc_descripcion_zona">Descripción de Zona</Label>
                  <Input
                    id="oc_descripcion_zona"
                    placeholder="Zona de entrega o aplicación"
                    className="bg-slate-50"
                    value={newExpediente.oc_descripcion_zona || ""}
                    onChange={(e) => setNewExpediente({ ...newExpediente, oc_descripcion_zona: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oc_forma_pago">Forma de Pago</Label>
                    <Input
                      id="oc_forma_pago"
                      placeholder="Ej: Contado, 30 días"
                      className="bg-slate-50"
                      value={newExpediente.oc_forma_pago || ""}
                      onChange={(e) => setNewExpediente({ ...newExpediente, oc_forma_pago: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oc_plazo_entrega">Plazo de Entrega</Label>
                    <Input
                      id="oc_plazo_entrega"
                      placeholder="Ej: 15 días"
                      className="bg-slate-50"
                      value={newExpediente.oc_plazo_entrega || ""}
                      onChange={(e) => setNewExpediente({ ...newExpediente, oc_plazo_entrega: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateExpediente} className="bg-blue-600 hover:bg-blue-700">
              Crear Expediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles del Expediente */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent showCloseButton={false} className="w-[75vw] max-h-[70vh] bg-gradient-to-br from-white to-slate-50 p-0 overflow-hidden">
          <div className="overflow-y-auto max-h-[70vh] px-6 pt-6">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Expediente {selectedRecord?.numero}-{selectedRecord?.año}
                  </DialogTitle>
                  <DialogDescription className="text-base text-slate-600">
                    {selectedRecord?.asunto}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRecord && (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                      selectedRecord.estado === "Finalizado" && "bg-green-100 text-green-700",
                      selectedRecord.estado === "EnProceso" && "bg-blue-100 text-blue-700",
                      selectedRecord.estado === "Iniciado" && "bg-yellow-100 text-yellow-700"
                    )}>
                      <div className={cn("h-2 w-2 rounded-full", getStatusColor(selectedRecord.estado))} />
                      {getStatusLabel(selectedRecord.estado)}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-6 py-6">
              {/* Información Principal */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-blue-600" />
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Tipo
                    </p>
                    <p className="text-sm font-medium text-slate-900">{selectedRecord.tipo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Prioridad
                    </p>
                    <div className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold",
                      selectedRecord.prioridad === "Urgente" && "bg-red-100 text-red-700",
                      selectedRecord.prioridad === "Alta" && "bg-orange-100 text-orange-700",
                      selectedRecord.prioridad === "Media" && "bg-yellow-100 text-yellow-700",
                      selectedRecord.prioridad === "Baja" && "bg-green-100 text-green-700"
                    )}>
                      {selectedRecord.prioridad}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Área Responsable
                    </p>
                    <p className="text-sm font-medium text-slate-900">{selectedRecord.area_responsable}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Agente
                    </p>
                    <p className="text-sm font-medium text-slate-900">{selectedRecord.agente_responsable_id || "No asignado"}</p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedRecord.descripcion && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Descripción
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedRecord.descripcion}</p>
                </div>
              )}

              {/* Fechas */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Fechas
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha de Inicio</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedRecord.fecha_inicio ? formatDate(selectedRecord.fecha_inicio) : "No especificada"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha de Vencimiento</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedRecord.fecha_vencimiento ? formatDate(selectedRecord.fecha_vencimiento) : "No especificada"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Creado</p>
                    <p className="text-sm text-slate-700">{formatDate(selectedRecord.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Última Actualización</p>
                    <p className="text-sm text-slate-700">{formatDate(selectedRecord.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Campos específicos para expedientes de tipo Pago */}
              {selectedRecord.tipo === "Pago" && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Datos de Orden de Compra
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {selectedRecord.oc_señor && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Proveedor
                        </p>
                        <p className="text-sm font-medium text-blue-900">{selectedRecord.oc_señor}</p>
                      </div>
                    )}
                    {selectedRecord.oc_domicilio && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Domicilio
                        </p>
                        <p className="text-sm font-medium text-blue-900">{selectedRecord.oc_domicilio}</p>
                      </div>
                    )}
                    {selectedRecord.oc_cuit && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          CUIT
                        </p>
                        <p className="text-sm font-medium text-blue-900">{selectedRecord.oc_cuit}</p>
                      </div>
                    )}
                    {selectedRecord.oc_descripcion_zona && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Zona
                        </p>
                        <p className="text-sm font-medium text-blue-900">{selectedRecord.oc_descripcion_zona}</p>
                      </div>
                    )}
                    {selectedRecord.oc_forma_pago && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          Forma de Pago
                        </p>
                        <p className="text-sm font-medium text-blue-900">{selectedRecord.oc_forma_pago}</p>
                      </div>
                    )}
                    {selectedRecord.oc_plazo_entrega && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          Plazo de Entrega
                        </p>
                        <p className="text-sm font-medium text-blue-900">{selectedRecord.oc_plazo_entrega}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-4 px-6 pb-6">
            <div className="flex flex-wrap gap-2 w-full justify-between">
              {selectedRecord?.tipo === "Pago" && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (selectedRecord) {
                      handleGenerarOC(selectedRecord);
                    }
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Generar Orden de Compra
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                Cerrar
              </Button>
            </div>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {contextMenu.visible && (
        <div className="fixed inset-0 z-[100]" onClick={closeContextMenu}>
          <div
            className="absolute min-w-[240px] rounded-lg border border-slate-200 bg-white shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {contextMenu.items.map((item, idx) => (
              <button
                key={`${item.label}-${idx}`}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-150 hover:translate-x-0.5",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-100"
                )}
                onClick={item.onClick}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
