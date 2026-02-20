import { useState, useEffect } from "react";
import { Users, Plus, Edit, Trash2, AlertCircle, Clock, User, Briefcase, CreditCard, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";
import type { Agente, CreateAgenteInput, AgenteConSemaforo, SemaforoStatus } from "@/types/agente";

type DetailTab = "legajo" | "personal" | "laboral" | "licencia" | "tallas";

export default function Personal() {
  const [agentes, setAgentes] = useState<AgenteConSemaforo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<AgenteConSemaforo | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<DetailTab>("legajo");
  const [editingAgente, setEditingAgente] = useState<AgenteConSemaforo | null>(null);
  const [newAgente, setNewAgente] = useState<Partial<CreateAgenteInput>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

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
        { 
          id: "1", 
          nombre: "Juan", 
          apellido: "Pérez", 
          dni: "12345678", 
          legajo: "001", 
          area: "Operaciones", 
          tipo_licencia: "B1", 
          fecha_vencimiento_licencia: "2026-02-20",
          fecha_nacimiento: "1990-05-15",
          telefono: "2604123456",
          email: "juan.perez@irrigacion.gob.ar",
          direccion: "San Martín 123, Godoy Cruz",
          fecha_ingreso: "2015-03-10",
          cargo: "Operario de Campo",
          talla_camisa: "L",
          talla_pantalon: "42",
          talla_calzado: "42",
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
        { 
          id: "2", 
          nombre: "María", 
          apellido: "González", 
          dni: "23456789", 
          legajo: "002", 
          area: "Mantenimiento", 
          tipo_licencia: "C1", 
          fecha_vencimiento_licencia: "2026-03-15",
          fecha_nacimiento: "1985-08-22",
          telefono: "2604234567",
          email: "maria.gonzalez@irrigacion.gob.ar",
          direccion: "Belgrano 456, Mendoza",
          fecha_ingreso: "2012-07-15",
          cargo: "Técnica de Mantenimiento",
          talla_camisa: "M",
          talla_pantalon: "38",
          talla_calzado: "37",
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
        { 
          id: "3", 
          nombre: "Carlos", 
          apellido: "Rodríguez", 
          dni: "34567890", 
          legajo: "003", 
          area: "Administración", 
          tipo_licencia: "B2", 
          fecha_vencimiento_licencia: "2026-08-10",
          fecha_nacimiento: "1988-11-30",
          telefono: "2604345678",
          email: "carlos.rodriguez@irrigacion.gob.ar",
          direccion: "Mitre 789, Luján de Cuyo",
          fecha_ingreso: "2018-01-20",
          cargo: "Administrativo",
          talla_camisa: "XL",
          talla_pantalon: "44",
          talla_calzado: "43",
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
        { 
          id: "4", 
          nombre: "Ana", 
          apellido: "Martínez", 
          dni: "45678901", 
          legajo: "004", 
          area: "Operaciones",
          fecha_nacimiento: "1995-02-10",
          telefono: "2604456789",
          email: "ana.martinez@irrigacion.gob.ar",
          direccion: "Lavalle 321, Guaymallén",
          fecha_ingreso: "2020-09-01",
          cargo: "Auxiliar Administrativa",
          talla_camisa: "S",
          talla_pantalon: "36",
          talla_calzado: "36",
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
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

  const handleEditAgente = (agente: AgenteConSemaforo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgente(agente);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAgente = async () => {
    if (!editingAgente) return;
    try {
      // await invoke("update_agente", { id: editingAgente.id, data: editingAgente });
      alert("Agente actualizado exitosamente");
      setIsEditDialogOpen(false);
      setEditingAgente(null);
      await loadAgentes();
    } catch (error) {
      alert("Error al actualizar agente: " + error);
    }
  };

  const handleDeleteAgente = async (_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: "Eliminar Agente",
      message: "¿Estás seguro de que deseas eliminar este agente? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          // await invoke("delete_agente", { id: _id });
          await loadAgentes();
        } catch (error) {
          alert("Error al eliminar: " + error);
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
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

  const getSemaforoLabel = (status?: SemaforoStatus) => {
    if (!status) return "Sin información";

    const labels = {
      rojo: "Licencia vencida",
      naranja: "Próxima a vencer",
      verde: "Licencia vigente",
    };

    return labels[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-700">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 shrink-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Personal</h1>
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
              {/* Action Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lista de Personal</h2>
                  <p className="text-sm text-slate-600">Control de vencimientos y renovaciones</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Agente
                </Button>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Licencias</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Legajo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Apellido y Nombre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">DNI</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Área</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agentes.map((agente) => (
                      <tr 
                        key={agente.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        onClick={() => setSelectedAgente(agente)}
                      >
                        <td className="py-4 px-4">
                          {getSemaforoIndicator(agente.semaforo_status)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{agente.legajo}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{agente.apellido}, {agente.nombre}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">{agente.dni}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">{agente.area}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => handleEditAgente(agente, e)}
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => handleDeleteAgente(agente.id, e)}
                            >
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Nuevo Agente</DialogTitle>
            <DialogDescription>Registra un nuevo agente en el sistema</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] px-1">
            <div className="grid gap-4 py-4">
              {/* Datos Básicos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Datos Básicos</h4>
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
              </div>

              {/* Información Personal */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input
                      type="date"
                      value={newAgente.fecha_nacimiento || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="2604123456"
                      value={newAgente.telefono || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="ejemplo@irrigacion.gob.ar"
                      value={newAgente.email || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Calle y número, localidad"
                      value={newAgente.direccion || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, direccion: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Información Laboral</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Área *</Label>
                    <Input
                      placeholder="Operaciones"
                      value={newAgente.area || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, area: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      placeholder="Operario de Campo"
                      value={newAgente.cargo || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, cargo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Ingreso</Label>
                    <Input
                      type="date"
                      value={newAgente.fecha_ingreso || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, fecha_ingreso: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Licencia */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Licencia de Conducir</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Licencia</Label>
                    <Select value={newAgente.tipo_licencia} onValueChange={(value) => setNewAgente({ ...newAgente, tipo_licencia: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin licencia" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800">
                        <SelectItem value="B1" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">B1</SelectItem>
                        <SelectItem value="B2" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">B2</SelectItem>
                        <SelectItem value="C1" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">C1</SelectItem>
                        <SelectItem value="C2" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">C2</SelectItem>
                        <SelectItem value="D1" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">D1</SelectItem>
                        <SelectItem value="D2" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">D2</SelectItem>
                        <SelectItem value="Profesional" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Profesional</SelectItem>
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

              {/* Tallas */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Tallas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Talla de Camisa</Label>
                    <Input
                      placeholder="L"
                      value={newAgente.talla_camisa || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, talla_camisa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Talla de Pantalón</Label>
                    <Input
                      placeholder="42"
                      value={newAgente.talla_pantalon || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, talla_pantalon: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Talla de Calzado</Label>
                    <Input
                      placeholder="42"
                      value={newAgente.talla_calzado || ""}
                      onChange={(e) => setNewAgente({ ...newAgente, talla_calzado: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAgente} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Agente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Agente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
            <DialogDescription>Modifica los datos del agente</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] px-1">
            <div className="grid gap-4 py-4">
              {/* Datos Básicos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Datos Básicos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      placeholder="Juan"
                      value={editingAgente?.nombre || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, nombre: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido *</Label>
                    <Input
                      placeholder="Pérez"
                      value={editingAgente?.apellido || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, apellido: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DNI *</Label>
                    <Input
                      placeholder="12345678"
                      value={editingAgente?.dni || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, dni: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legajo *</Label>
                    <Input
                      placeholder="001"
                      value={editingAgente?.legajo || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, legajo: e.target.value } : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input
                      type="date"
                      value={editingAgente?.fecha_nacimiento || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, fecha_nacimiento: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="2604123456"
                      value={editingAgente?.telefono || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, telefono: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="ejemplo@irrigacion.gob.ar"
                      value={editingAgente?.email || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, email: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Calle y número, localidad"
                      value={editingAgente?.direccion || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, direccion: e.target.value } : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Información Laboral</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Área *</Label>
                    <Input
                      placeholder="Operaciones"
                      value={editingAgente?.area || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, area: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      placeholder="Operario de Campo"
                      value={editingAgente?.cargo || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, cargo: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Ingreso</Label>
                    <Input
                      type="date"
                      value={editingAgente?.fecha_ingreso || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, fecha_ingreso: e.target.value } : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Licencia */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Licencia de Conducir</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Licencia</Label>
                    <Select value={editingAgente?.tipo_licencia} onValueChange={(value) => setEditingAgente(editingAgente ? { ...editingAgente, tipo_licencia: value as any } : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin licencia" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800">
                        <SelectItem value="B1" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">B1</SelectItem>
                        <SelectItem value="B2" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">B2</SelectItem>
                        <SelectItem value="C1" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">C1</SelectItem>
                        <SelectItem value="C2" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">C2</SelectItem>
                        <SelectItem value="D1" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">D1</SelectItem>
                        <SelectItem value="D2" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">D2</SelectItem>
                        <SelectItem value="Profesional" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Profesional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={editingAgente?.fecha_vencimiento_licencia || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, fecha_vencimiento_licencia: e.target.value } : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Tallas */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Tallas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Talla de Camisa</Label>
                    <Input
                      placeholder="L"
                      value={editingAgente?.talla_camisa || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, talla_camisa: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Talla de Pantalón</Label>
                    <Input
                      placeholder="42"
                      value={editingAgente?.talla_pantalon || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, talla_pantalon: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Talla de Calzado</Label>
                    <Input
                      placeholder="42"
                      value={editingAgente?.talla_calzado || ""}
                      onChange={(e) => setEditingAgente(editingAgente ? { ...editingAgente, talla_calzado: e.target.value } : null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateAgente} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles de Agente */}
      <Dialog open={!!selectedAgente} onOpenChange={() => {
        setSelectedAgente(null);
        setDetailActiveTab("legajo");
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Detalles del Agente</DialogTitle>
            <DialogDescription>Información completa del agente seleccionado</DialogDescription>
          </DialogHeader>
          {selectedAgente && (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="border-b border-slate-200 px-6">
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setDetailActiveTab("legajo")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      detailActiveTab === "legajo"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <User className="h-4 w-4" />
                    Legajo
                  </button>
                  <button
                    onClick={() => setDetailActiveTab("personal")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      detailActiveTab === "personal"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Información Personal
                  </button>
                  <button
                    onClick={() => setDetailActiveTab("laboral")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      detailActiveTab === "laboral"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <Briefcase className="h-4 w-4" />
                    Información Laboral
                  </button>
                  <button
                    onClick={() => setDetailActiveTab("licencia")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      detailActiveTab === "licencia"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <CreditCard className="h-4 w-4" />
                    Licencia
                  </button>
                  <button
                    onClick={() => setDetailActiveTab("tallas")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      detailActiveTab === "tallas"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <Shirt className="h-4 w-4" />
                    Tallas
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="overflow-y-auto px-6 py-6">
                {/* Tab: Legajo */}
                {detailActiveTab === "legajo" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Legajo</p>
                        <p className="text-lg font-mono font-bold text-slate-900">{selectedAgente.legajo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Nombre Completo</p>
                        <p className="text-lg font-semibold text-slate-900">{selectedAgente.apellido}, {selectedAgente.nombre}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">DNI</p>
                        <p className="text-base text-slate-900">{selectedAgente.dni}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Área</p>
                        <p className="text-base text-slate-900">{selectedAgente.area}</p>
                      </div>
                      {selectedAgente.cargo && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-500">Cargo</p>
                          <p className="text-base text-slate-900">{selectedAgente.cargo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Información Personal */}
                {detailActiveTab === "personal" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Nombre Completo</p>
                        <p className="text-base text-slate-900">{selectedAgente.apellido}, {selectedAgente.nombre}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">DNI</p>
                        <p className="text-base text-slate-900">{selectedAgente.dni}</p>
                      </div>
                      {selectedAgente.fecha_nacimiento && (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">Fecha de Nacimiento</p>
                            <p className="text-base text-slate-900">
                              {new Date(selectedAgente.fecha_nacimiento).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">Edad</p>
                            <p className="text-base text-slate-900">
                              {Math.floor((new Date().getTime() - new Date(selectedAgente.fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años
                            </p>
                          </div>
                        </>
                      )}
                      {selectedAgente.telefono && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-500">Teléfono</p>
                          <p className="text-base text-slate-900">{selectedAgente.telefono}</p>
                        </div>
                      )}
                      {selectedAgente.email && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-500">Email</p>
                          <p className="text-base text-slate-900">{selectedAgente.email}</p>
                        </div>
                      )}
                      {selectedAgente.direccion && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm font-medium text-slate-500">Dirección</p>
                          <p className="text-base text-slate-900">{selectedAgente.direccion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Información Laboral */}
                {detailActiveTab === "laboral" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Área</p>
                        <p className="text-base text-slate-900">{selectedAgente.area}</p>
                      </div>
                      {selectedAgente.cargo && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-500">Cargo</p>
                          <p className="text-base text-slate-900">{selectedAgente.cargo}</p>
                        </div>
                      )}
                      {selectedAgente.fecha_ingreso && (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">Fecha de Ingreso</p>
                            <p className="text-base text-slate-900">
                              {new Date(selectedAgente.fecha_ingreso).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">Antigüedad</p>
                            <p className="text-base text-slate-900">
                              {Math.floor((new Date().getTime() - new Date(selectedAgente.fecha_ingreso).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años
                            </p>
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Legajo</p>
                        <p className="text-base font-mono font-semibold text-slate-900">{selectedAgente.legajo}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Licencia */}
                {detailActiveTab === "licencia" && (
                  <div className="space-y-4">
                    {/* Semáforo de Licencia */}
                    {selectedAgente.tipo_licencia && (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border-l-4" style={{
                          borderLeftColor: selectedAgente.semaforo_status === 'rojo' ? '#ef4444' : 
                                          selectedAgente.semaforo_status === 'naranja' ? '#f59e0b' : '#10b981'
                        }}>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">Estado de Licencia</p>
                            <p className="text-sm text-slate-600">{getSemaforoLabel(selectedAgente.semaforo_status)}</p>
                          </div>
                          {getSemaforoIndicator(selectedAgente.semaforo_status)}
                        </div>

                        {/* Leyenda de colores */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm">Leyenda de Vencimientos</h4>
                          <div className="flex flex-col gap-2 text-sm">
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
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Tipo de Licencia</p>
                        <span className="text-base text-slate-900">{selectedAgente.tipo_licencia || "Sin licencia"}</span>
                      </div>
                      {selectedAgente.fecha_vencimiento_licencia && (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">Fecha de Vencimiento</p>
                            <p className="text-base text-slate-900">
                              {new Date(selectedAgente.fecha_vencimiento_licencia).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">Días Restantes</p>
                            {selectedAgente.dias_restantes !== undefined ? (
                              <Badge
                                className={cn(
                                  selectedAgente.semaforo_status === "rojo" && "bg-red-500 text-white",
                                  selectedAgente.semaforo_status === "naranja" && "bg-orange-500 text-white",
                                  selectedAgente.semaforo_status === "verde" && "bg-emerald-500 text-white"
                                )}
                              >
                                {selectedAgente.dias_restantes} días
                              </Badge>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Tallas */}
                {detailActiveTab === "tallas" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Talla de Camisa</p>
                        <p className="text-base text-slate-900">{selectedAgente.talla_camisa || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Talla de Pantalón</p>
                        <p className="text-base text-slate-900">{selectedAgente.talla_pantalon || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Talla de Calzado</p>
                        <p className="text-base text-slate-900">{selectedAgente.talla_calzado || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer info */}
                <div className="border-t pt-4 mt-6">
                  <p className="text-xs text-slate-500">Registrado: {new Date(selectedAgente.created_at).toLocaleString('es-AR')}</p>
                  <p className="text-xs text-slate-500">Última actualización: {new Date(selectedAgente.updated_at).toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => {
              setSelectedAgente(null);
              setDetailActiveTab("legajo");
            }}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
