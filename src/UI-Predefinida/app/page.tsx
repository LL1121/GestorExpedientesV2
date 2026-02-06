"use client"

import { useState, Suspense } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type RecordStatus = "pending" | "archived" | "paid" | "active"
type RecordType = "electronic" | "physical"

interface Record {
  id: string
  title: string
  status: RecordStatus
  type: RecordType
  lastUpdated: string
  assignee: string
  category: string
  description: string
  createdDate: string
  amount?: string
}

// Sample data
const sampleRecords: Record[] = [
  {
    id: "EXP-2024-0421",
    title: "Solicitud de Concesión - Río Verde",
    status: "active",
    type: "electronic",
    lastUpdated: "2024-01-08",
    assignee: "María González",
    category: "Concesiones",
    description:
      "Solicitud de concesión para uso agrícola en la cuenca del Río Verde. Requiere revisión técnica y aprobación del comité.",
    createdDate: "2023-12-15",
    amount: "$45,000",
  },
  {
    id: "EXP-2024-0389",
    title: "Renovación Permiso - Zona Industrial Norte",
    status: "pending",
    type: "physical",
    lastUpdated: "2024-01-07",
    assignee: "Carlos Ramírez",
    category: "Permisos",
    description: "Renovación de permiso de extracción para complejo industrial. Documentación pendiente de revisión.",
    createdDate: "2023-11-22",
    amount: "$120,000",
  },
  {
    id: "EXP-2023-2104",
    title: "Auditoría Uso Doméstico - Sector 7",
    status: "paid",
    type: "electronic",
    lastUpdated: "2024-01-06",
    assignee: "Ana Martínez",
    category: "Auditorías",
    description: "Auditoría completada para verificar uso adecuado de recursos hídricos en zona residencial.",
    createdDate: "2023-10-05",
    amount: "$8,500",
  },
  {
    id: "EXP-2023-1876",
    title: "Informe Ambiental - Cuenca Sur",
    status: "archived",
    type: "physical",
    lastUpdated: "2023-12-20",
    assignee: "Luis Fernández",
    category: "Estudios",
    description: "Estudio de impacto ambiental archivado. Proyecto completado sin observaciones.",
    createdDate: "2023-08-12",
  },
  {
    id: "EXP-2024-0502",
    title: "Inspección Pozo Agrícola - Parcela 45",
    status: "active",
    type: "electronic",
    lastUpdated: "2024-01-08",
    assignee: "Patricia Silva",
    category: "Inspecciones",
    description: "Inspección programada para verificar cumplimiento de normativas de extracción.",
    createdDate: "2024-01-02",
    amount: "$12,000",
  },
  {
    id: "EXP-2024-0478",
    title: "Revisión Tarifaria - Distrito 3",
    status: "pending",
    type: "electronic",
    lastUpdated: "2024-01-05",
    assignee: "Roberto Díaz",
    category: "Tarifas",
    description: "Revisión de estructura tarifaria para usuarios del distrito. En proceso de análisis.",
    createdDate: "2023-12-28",
  },
]

type FilterType = "all" | "pending" | "archived" | "paid" | "electronic" | "physical"

function DashboardContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isOnline] = useState(true)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const filterOptions: { label: string; value: FilterType; count: number }[] = [
    { label: "Todos", value: "all", count: sampleRecords.length },
    { label: "Pendientes", value: "pending", count: sampleRecords.filter((r) => r.status === "pending").length },
    { label: "Archivados", value: "archived", count: sampleRecords.filter((r) => r.status === "archived").length },
    { label: "Pagados", value: "paid", count: sampleRecords.filter((r) => r.status === "paid").length },
    { label: "Electrónico", value: "electronic", count: sampleRecords.filter((r) => r.type === "electronic").length },
    { label: "Físico", value: "physical", count: sampleRecords.filter((r) => r.type === "physical").length },
  ]

  const filteredRecords = sampleRecords.filter((record) => {
    const matchesSearch =
      searchQuery === "" ||
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = activeFilter === "all" || record.status === activeFilter || record.type === activeFilter

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: RecordStatus) => {
    switch (status) {
      case "active":
        return "bg-blue-500"
      case "pending":
        return "bg-amber-500"
      case "archived":
        return "bg-slate-400"
      case "paid":
        return "bg-emerald-500"
      default:
        return "bg-slate-400"
    }
  }

  const getStatusLabel = (status: RecordStatus) => {
    switch (status) {
      case "active":
        return "Activo"
      case "pending":
        return "Pendiente"
      case "archived":
        return "Archivado"
      case "paid":
        return "Pagado"
      default:
        return status
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64",
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
                item.active ? "bg-blue-500/10 text-blue-600" : "text-slate-600 hover:bg-slate-100",
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
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
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
          {filteredRecords.length === 0 ? (
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
                      Título
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Última Actualización
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Responsable
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
                          <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(record.status))} />
                          <span className="text-xs font-medium text-slate-600">{getStatusLabel(record.status)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono text-slate-900">{record.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-slate-900 line-clamp-1">{record.title}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={record.type === "electronic" ? "default" : "secondary"} className="text-xs">
                          {record.type === "electronic" ? "Electrónico" : "Físico"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">{record.lastUpdated}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">{record.assignee}</span>
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
                            <DropdownMenuItem className="text-destructive">
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

      {/* Dialog for Record Details */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-slate-900">{selectedRecord.title}</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 font-mono">{selectedRecord.id}</DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full", getStatusColor(selectedRecord.status))} />
                  <span className="text-sm font-semibold text-slate-900">{getStatusLabel(selectedRecord.status)}</span>
                  <Badge variant={selectedRecord.type === "electronic" ? "default" : "secondary"}>
                    {selectedRecord.type === "electronic" ? "Electrónico" : "Físico"}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Descripción</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedRecord.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">Fecha de Creación</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{selectedRecord.createdDate}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Última Actualización</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{selectedRecord.lastUpdated}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium">Responsable</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{selectedRecord.assignee}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <FileText className="h-4 w-4" />
                      <span className="text-xs font-medium">Categoría</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{selectedRecord.category}</p>
                  </div>
                  {selectedRecord.amount && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <span className="text-xs font-medium">Monto</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{selectedRecord.amount}</p>
                    </div>
                  )}
                </div>

                {/* History Timeline */}
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Historial</h3>
                  <div className="space-y-4">
                    {[
                      {
                        date: selectedRecord.lastUpdated,
                        action: "Última actualización del expediente",
                        user: selectedRecord.assignee,
                      },
                      { date: selectedRecord.createdDate, action: "Expediente creado", user: selectedRecord.assignee },
                    ].map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1" />
                          {idx < 1 && <div className="w-px h-full bg-slate-200 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium text-slate-900">{event.action}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {event.date} • {event.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  Cerrar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Expediente
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Adding New Record */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">Añadir Nuevo Expediente</DialogTitle>
            <DialogDescription>Complete los campos para crear un nuevo expediente en el sistema.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Expediente</Label>
              <Input
                id="title"
                placeholder="Ej: Solicitud de Concesión - Río Verde"
                className="focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select defaultValue="pending">
                  <SelectTrigger id="status" className="focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select defaultValue="electronic">
                  <SelectTrigger id="type" className="focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronic">Electrónico</SelectItem>
                    <SelectItem value="physical">Físico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select defaultValue="concesiones">
                <SelectTrigger id="category" className="focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concesiones">Concesiones</SelectItem>
                  <SelectItem value="permisos">Permisos</SelectItem>
                  <SelectItem value="auditorias">Auditorías</SelectItem>
                  <SelectItem value="estudios">Estudios</SelectItem>
                  <SelectItem value="inspecciones">Inspecciones</SelectItem>
                  <SelectItem value="tarifas">Tarifas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Responsable</Label>
              <Input id="assignee" placeholder="Nombre del responsable" className="focus-visible:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto (Opcional)</Label>
              <Input id="amount" placeholder="$0.00" type="text" className="focus-visible:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción detallada del expediente..."
                rows={4}
                className="focus-visible:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Expediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
