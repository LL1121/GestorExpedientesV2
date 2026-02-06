import { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  FileText,
  Archive,
  BarChart3,
  Settings,
  MoreVertical,
  Menu,
  Wifi,
  WifiOff,
  Filter,
  Calendar,
  User,
  Edit,
  Trash2,
  Download,
  Clock,
  Plus,
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

type FilterType = "all" | EstadoExpediente | "InfoGov" | "Gde" | "Interno" | "Otro";

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

  // Cargar expedientes al montar el componente
  useEffect(() => {
    loadExpedientes();
  }, []);

  const loadExpedientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ExpedienteService.getAll();
      setExpedientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const filterOptions: { label: string; value: FilterType; count: number }[] = [
    { label: "Todos", value: "all", count: expedientes.length },
    { label: "Iniciado", value: "Iniciado", count: expedientes.filter((r) => r.estado === "Iniciado").length },
    { label: "En Proceso", value: "EnProceso", count: expedientes.filter((r) => r.estado === "EnProceso").length },
    { label: "Finalizado", value: "Finalizado", count: expedientes.filter((r) => r.estado === "Finalizado").length },
    { label: "Archivado", value: "Archivado", count: expedientes.filter((r) => r.estado === "Archivado").length },
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

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!sidebarCollapsed && <h1 className="font-semibold text-slate-900 text-lg">Irrigación Records</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: FileText, label: "Expedientes", active: false },
            { icon: Archive, label: "Archivo", active: false },
            { icon: BarChart3, label: "Analíticas", active: false },
            { icon: Settings, label: "Configuración", active: false },
          ].map((item, idx) => (
            <button
              key={idx}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                item.active ? "bg-blue-500/10 text-blue-600" : "text-slate-600 hover:bg-slate-100"
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
        {/* Header with Search */}
        <header className="h-32 bg-white border-b border-slate-200 flex flex-col justify-center px-8">
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

        {/* Filter Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeFilter === option.value
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {option.label}
                <span className="ml-2 text-xs opacity-70">({option.count})</span>
              </button>
            ))}
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir Expediente
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {loading ? (
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
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
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
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(record.estado))} />
                          <span className="text-xs font-medium text-slate-600">{getStatusLabel(record.estado)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono text-slate-900">
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
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
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
          )}
        </div>
      </div>

      {/* El código continúa... (Dialogs) */}
    </div>
  );
}
