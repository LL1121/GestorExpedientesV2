import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Users, Plus, Edit, Trash2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Agente, CreateAgenteInput, AgenteConSemaforo, SemaforoStatus } from "@/types/agente";

export default function Personal() {
  const [agentes, setAgentes] = useState<AgenteConSemaforo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<AgenteConSemaforo | null>(null);
  const [newAgente, setNewAgente] = useState<Partial<CreateAgenteInput>>({});

  useEffect(() => {
    loadAgentes();
  }, []);

  const loadAgentes = async () => {
    setLoading(true);
    try {
      // const data = await invoke<Agente[]>("get_all_agentes");
      // const agentesConSemaforo = data.map(calcularSemaforo);
      // setAgentes(agentesConSemaforo);
      
      // Mock data con cálculo de semáforo
      const mockData: Agente[] = [
        { id: "1", nombre: "Juan", apellido: "Pérez", dni: "12345678", legajo: "001", area: "Operaciones", tipo_licencia: "B1", fecha_vencimiento_licencia: "2026-02-20", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "2", nombre: "María", apellido: "González", dni: "23456789", legajo: "002", area: "Mantenimiento", tipo_licencia: "C1", fecha_vencimiento_licencia: "2026-03-15", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "3", nombre: "Carlos", apellido: "Rodríguez", dni: "34567890", legajo: "003", area: "Administración", tipo_licencia: "B2", fecha_vencimiento_licencia: "2026-08-10", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "4", nombre: "Ana", apellido: "Martínez", dni: "45678901", legajo: "004", area: "Operaciones", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
      
      const agentesConSemaforo = mockData.map(calcularSemaforo);
      setAgentes(agentesConSemaforo);
    } catch (error) {
      console.error("Error al cargar agentes:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularSemaforo = (agente: Agente): AgenteConSemaforo => {
    if (!agente.fecha_vencimiento_licencia) {
      return { ...agente, dias_restantes: undefined, semaforo_status: undefined };
    }

    const hoy = new Date();
    const vencimiento = new Date(agente.fecha_vencimiento_licencia);
    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    let status: SemaforoStatus;
    if (diasRestantes < 15) {
      status = "rojo";
    } else if (diasRestantes < 45) {
      status = "naranja";
    } else {
      status = "verde";
    }

    return {
      ...agente,
      dias_restantes: diasRestantes > 0 ? diasRestantes : 0,
      semaforo_status: status,
    };
  };

  const handleCreateAgente = async () => {
    try {
      if (!newAgente.nombre || !newAgente.apellido || !newAgente.dni || !newAgente.legajo) {
        alert("Completa todos los campos requeridos");
        return;
      }
      // await invoke("create_agente", { data: newAgente });
      setIsAddDialogOpen(false);
      setNewAgente({});
      await loadAgentes();
    } catch (error) {
      alert("Error al crear agente: " + error);
    }
  };

  const handleDeleteAgente = async (id: string) => {
    if (confirm("¿Eliminar este agente?")) {
      try {
        // await invoke("delete_agente", { id });
        await loadAgentes();
      } catch (error) {
        alert("Error al eliminar: " + error);
      }
    }
  };

  const getSemaforoIndicator = (status?: SemaforoStatus) => {
    if (!status) return null;

    const colors = {
      rojo: "bg-red-500",
      naranja: "bg-orange-500",
      verde: "bg-emerald-500",
    };

    return (
      <div className="flex items-center gap-2">
        <div className={cn("h-3 w-3 rounded-full", colors[status])} />
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Personal</h1>
          <p className="text-sm text-slate-600 mt-1">Gestión de agentes y control de licencias</p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Cargando agentes...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Agentes</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{agentes.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Licencias Críticas</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        {agentes.filter(a => a.semaforo_status === "rojo").length}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Por Vencer</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {agentes.filter(a => a.semaforo_status === "naranja").length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Sin Licencia</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {agentes.filter(a => !a.tipo_licencia).length}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Semáforo de Licencias</h2>
                  <p className="text-sm text-slate-600">Control de vencimientos y renovaciones</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Agente
                </Button>
              </div>

              {/* Legend */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-slate-700"><strong>Rojo:</strong> Menos de 15 días</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-slate-700"><strong>Naranja:</strong> Entre 15 y 45 días</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-700"><strong>Verde:</strong> Más de 45 días</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Semáforo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Legajo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Apellido y Nombre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">DNI</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Área</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Tipo Lic.</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Vencimiento</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Días Restantes</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agentes.map((agente) => (
                      <tr 
                        key={agente.id} 
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedAgente(agente)}
                      >
                        <td className="py-4 px-4">
                          {getSemaforoIndicator(agente.semaforo_status)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-mono font-semibold text-slate-900">{agente.legajo}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-slate-900">{agente.apellido}, {agente.nombre}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">{agente.dni}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">{agente.area}</span>
                        </td>
                        <td className="py-4 px-4">
                          {agente.tipo_licencia ? (
                            <Badge variant="secondary">{agente.tipo_licencia}</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">Sin licencia</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {agente.fecha_vencimiento_licencia ? (
                            <span className="text-sm text-slate-600">{formatDate(agente.fecha_vencimiento_licencia)}</span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {agente.dias_restantes !== undefined ? (
                            <Badge
                              className={cn(
                                agente.semaforo_status === "rojo" && "bg-red-500 text-white",
                                agente.semaforo_status === "naranja" && "bg-orange-500 text-white",
                                agente.semaforo_status === "verde" && "bg-emerald-500 text-white"
                              )}
                            >
                              {agente.dias_restantes} días
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAgente(agente.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Agregar Agente */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Nuevo Agente</DialogTitle>
            <DialogDescription>Registra un nuevo agente en el sistema</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Juan"
                  value={newAgente.nombre || ""}
                  onChange={(e) => setNewAgente({ ...newAgente, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Pérez"
                  value={newAgente.apellido || ""}
                  onChange={(e) => setNewAgente({ ...newAgente, apellido: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DNI *</Label>
                <Input
                  placeholder="12345678"
                  value={newAgente.dni || ""}
                  onChange={(e) => setNewAgente({ ...newAgente, dni: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Legajo *</Label>
                <Input
                  placeholder="001"
                  value={newAgente.legajo || ""}
                  onChange={(e) => setNewAgente({ ...newAgente, legajo: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Área *</Label>
              <Input
                placeholder="Operaciones"
                value={newAgente.area || ""}
                onChange={(e) => setNewAgente({ ...newAgente, area: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Licencia</Label>
                <Select value={newAgente.tipo_licencia} onValueChange={(value) => setNewAgente({ ...newAgente, tipo_licencia: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin licencia" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="B1" className="cursor-pointer hover:bg-slate-100">B1</SelectItem>
                    <SelectItem value="B2" className="cursor-pointer hover:bg-slate-100">B2</SelectItem>
                    <SelectItem value="C1" className="cursor-pointer hover:bg-slate-100">C1</SelectItem>
                    <SelectItem value="C2" className="cursor-pointer hover:bg-slate-100">C2</SelectItem>
                    <SelectItem value="D1" className="cursor-pointer hover:bg-slate-100">D1</SelectItem>
                    <SelectItem value="D2" className="cursor-pointer hover:bg-slate-100">D2</SelectItem>
                    <SelectItem value="Profesional" className="cursor-pointer hover:bg-slate-100">Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  value={newAgente.fecha_vencimiento_licencia || ""}
                  onChange={(e) => setNewAgente({ ...newAgente, fecha_vencimiento_licencia: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAgente} className="bg-blue-600 hover:bg-blue-700">Guardar Agente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles de Agente */}
      <Dialog open={!!selectedAgente} onOpenChange={() => setSelectedAgente(null)}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Detalles del Agente</DialogTitle>
            <DialogDescription>Información completa del agente seleccionado</DialogDescription>
          </DialogHeader>
          {selectedAgente && (
            <div className="grid gap-6 py-4">
              {/* Semáforo de Licencia */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border-l-4" style={{
                borderLeftColor: selectedAgente.semaforo_status === 'vencida' ? '#ef4444' : 
                                 selectedAgente.semaforo_status === 'por_vencer' ? '#f59e0b' : '#10b981'
              }}>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Estado de Licencia</p>
                  <p className="text-sm text-slate-600">{getSemaforoLabel(selectedAgente.semaforo_status)}</p>
                </div>
                {getSemaforoIndicator(selectedAgente.semaforo_status)}
              </div>

              {/* Información Personal */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Legajo</p>
                    <p className="text-base font-mono font-semibold text-slate-900">{selectedAgente.legajo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Nombre Completo</p>
                    <p className="text-base text-slate-900">{selectedAgente.apellido}, {selectedAgente.nombre}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Email</p>
                    <p className="text-base text-slate-900">{selectedAgente.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Teléfono</p>
                    <p className="text-base text-slate-900">{selectedAgente.telefono}</p>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Información Laboral</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Cargo</p>
                    <p className="text-base text-slate-900">{selectedAgente.cargo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Área</p>
                    <p className="text-base text-slate-900">{selectedAgente.area}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Estado</p>
                    <Badge className={selectedAgente.activo ? "bg-emerald-500" : "bg-slate-400"}>
                      {selectedAgente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Información de Licencia */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Licencia de Conducir</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Tipo de Licencia</p>
                    <Badge variant="secondary" className="text-sm">{selectedAgente.tipo_licencia}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Fecha de Vencimiento</p>
                    <p className="text-base text-slate-900">{new Date(selectedAgente.fecha_vencimiento_licencia).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm font-medium text-slate-500">Días hasta Vencimiento</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      selectedAgente.dias_hasta_vencimiento < 0 ? "text-red-600" :
                      selectedAgente.dias_hasta_vencimiento <= 30 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {selectedAgente.dias_hasta_vencimiento < 0 ? 
                        `Vencida hace ${Math.abs(selectedAgente.dias_hasta_vencimiento)} días` :
                        `${selectedAgente.dias_hasta_vencimiento} días`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-slate-500">Registrado: {new Date(selectedAgente.created_at).toLocaleString('es-AR')}</p>
                <p className="text-xs text-slate-500">Última actualización: {new Date(selectedAgente.updated_at).toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAgente(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
