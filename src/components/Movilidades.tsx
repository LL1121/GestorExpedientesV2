import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Truck, Fuel, Package, Plus, Edit, Trash2, TrendingUp, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Vehiculo, CreateVehiculoInput, TicketCombustible, CreateTicketInput, Consumible, CreateConsumibleInput } from "@/types/vehiculo";

type ActiveTab = "vehiculos" | "combustible" | "consumibles";

export default function Movilidades() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("vehiculos");
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tickets, setTickets] = useState<TicketCombustible[]>([]);
  const [consumibles, setConsumibles] = useState<Consumible[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddVehiculoOpen, setIsAddVehiculoOpen] = useState(false);
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);
  const [isAddMultipleTicketsOpen, setIsAddMultipleTicketsOpen] = useState(false);
  const [isAddConsumibleOpen, setIsAddConsumibleOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketCombustible | null>(null);
  const [selectedConsumible, setSelectedConsumible] = useState<Consumible | null>(null);

  const [newVehiculo, setNewVehiculo] = useState<Partial<CreateVehiculoInput>>({
    tipo: "Camioneta",
  });
  const [newTicket, setNewTicket] = useState<Partial<CreateTicketInput>>({
    fecha: new Date().toISOString().split('T')[0],
  });
  const [multipleTickets, setMultipleTickets] = useState<Partial<CreateTicketInput>[]>([
    { fecha: new Date().toISOString().split('T')[0] },
  ]);
  const [newConsumible, setNewConsumible] = useState<Partial<CreateConsumibleInput>>({
    unidad: "Unidad",
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "vehiculos") {
        // const data = await invoke<Vehiculo[]>("get_all_vehiculos");
        // setVehiculos(data);
        // Mock data por ahora
        setVehiculos([
          { id: "1", patente: "AA123BB", marca: "Toyota", modelo: "Hilux", año: 2020, tipo: "Camioneta", estado: "Activo", kilometraje: 45000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "2", patente: "CC456DD", marca: "Ford", modelo: "Ranger", año: 2019, tipo: "Camioneta", estado: "Activo", kilometraje: 78000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
      } else if (activeTab === "combustible") {
        // const data = await invoke<TicketCombustible[]>("get_all_tickets");
        // setTickets(data);
        // Mock data
        setTickets([
          { id: "1", vehiculo_id: "1", vehiculo_patente: "AA123BB", fecha: "2026-02-05", litros: 45, precio_total: 9000, kilometraje_actual: 45000, rendimiento: 12.5, created_at: new Date().toISOString() },
          { id: "2", vehiculo_id: "2", vehiculo_patente: "CC456DD", fecha: "2026-02-04", litros: 50, precio_total: 10000, kilometraje_actual: 78000, rendimiento: 8.2, created_at: new Date().toISOString() },
          { id: "3", vehiculo_id: "1", vehiculo_patente: "AA123BB", fecha: "2026-02-03", litros: 40, precio_total: 8000, kilometraje_actual: 44500, rendimiento: 10.8, created_at: new Date().toISOString() },
        ]);
      } else {
        // const data = await invoke<Consumible[]>("get_all_consumibles");
        // setConsumibles(data);
        // Mock data
        setConsumibles([
          { id: "1", nombre: "Aceite 15W40", categoria: "Lubricantes", cantidad: 25, unidad: "Litros", stock_minimo: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "2", nombre: "Filtro de Aire", categoria: "Filtros", cantidad: 8, unidad: "Unidad", stock_minimo: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehiculo = async () => {
    try {
      if (!newVehiculo.patente || !newVehiculo.marca || !newVehiculo.modelo) {
        alert("Completa todos los campos requeridos");
        return;
      }
      // await invoke("create_vehiculo", { data: newVehiculo });
      setIsAddVehiculoOpen(false);
      setNewVehiculo({ tipo: "Camioneta" });
      await loadData();
    } catch (error) {
      alert("Error al crear vehículo: " + error);
    }
  };

  const handleCreateTicket = async () => {
    try {
      if (!newTicket.vehiculo_id || !newTicket.litros || !newTicket.precio_total) {
        alert("Completa todos los campos requeridos");
        return;
      }
      // await invoke("create_ticket", { data: newTicket });
      setIsAddTicketOpen(false);
      setNewTicket({ fecha: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (error) {
      alert("Error al registrar carga: " + error);
    }
  };

  const handleCreateConsumible = async () => {
    try {
      if (!newConsumible.nombre || !newConsumible.cantidad) {
        alert("Completa todos los campos requeridos");
        return;
      }
      // await invoke("create_consumible", { data: newConsumible });
      setIsAddConsumibleOpen(false);
      setNewConsumible({ unidad: "Unidad" });
      await loadData();
    } catch (error) {
      alert("Error al crear consumible: " + error);
    }
  };

  const handleDeleteVehiculo = async (id: string) => {
    if (confirm("¿Eliminar este vehículo?")) {
      try {
        // await invoke("delete_vehiculo", { id });
        await loadData();
      } catch (error) {
        alert("Error al eliminar: " + error);
      }
    }
  };

  const getRendimientoBadge = (rendimiento?: number) => {
    if (!rendimiento) return <Badge variant="secondary">N/A</Badge>;
    
    if (rendimiento > 11) {
      return (
        <Badge className="bg-emerald-500 text-white">
          <TrendingUp className="h-3 w-3 mr-1" />
          {rendimiento.toFixed(1)} km/l
        </Badge>
      );
    } else if (rendimiento >= 9) {
      return (
        <Badge className="bg-blue-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          {rendimiento.toFixed(1)} km/l
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-500 text-white">
          <AlertCircle className="h-3 w-3 mr-1" />
          {rendimiento.toFixed(1)} km/l
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Movilidades</h1>
          <p className="text-sm text-slate-600 mt-1">Gestión de vehículos, combustible y consumibles</p>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-8">
          <div className="flex gap-4">
            {[
              { id: "vehiculos", label: "Vehículos", icon: Truck },
              { id: "combustible", label: "Combustible", icon: Fuel },
              { id: "consumibles", label: "Consumibles", icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* Vehículos Tab */}
              {activeTab === "vehiculos" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Flota de Vehículos</h2>
                      <p className="text-sm text-slate-600">{vehiculos.length} vehículos registrados</p>
                    </div>
                    <Button onClick={() => setIsAddVehiculoOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Vehículo
                    </Button>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Patente</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Marca/Modelo</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Año</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Kilometraje</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehiculos.map((vehiculo) => (
                          <tr 
                            key={vehiculo.id} 
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedVehiculo(vehiculo)}
                          >
                            <td className="py-4 px-4">
                              <span className="text-sm font-mono font-semibold text-slate-900">{vehiculo.patente}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-900">{vehiculo.marca} {vehiculo.modelo}</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">{vehiculo.tipo}</Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-600">{vehiculo.año}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-600">{vehiculo.kilometraje.toLocaleString()} km</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={vehiculo.estado === "Activo" ? "bg-emerald-500" : "bg-amber-500"}>
                                {vehiculo.estado}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteVehiculo(vehiculo.id)}>
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

              {/* Combustible Tab */}
              {activeTab === "combustible" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Registro de Combustible</h2>
                      <p className="text-sm text-slate-600">{tickets.length} cargas registradas</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Carga
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white">
                        <DropdownMenuItem
                          onClick={() => setIsAddTicketOpen(true)}
                          className="cursor-pointer py-3"
                        >
                          <Plus className="h-4 w-4 mr-3 text-blue-600" />
                          <span className="font-medium">Carga Individual</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setIsAddMultipleTicketsOpen(true)}
                          className="cursor-pointer py-3"
                        >
                          <Plus className="h-4 w-4 mr-3 text-emerald-600" />
                          <span className="font-medium">Carga Múltiple</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Vehículo</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Litros</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Precio Total</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Kilometraje</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Rendimiento</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tickets.map((ticket) => (
                          <tr 
                            key={ticket.id} 
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-900">{formatDate(ticket.fecha)}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm font-mono font-semibold text-slate-900">{ticket.vehiculo_patente}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-600">{ticket.litros} L</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-900">${ticket.precio_total.toLocaleString()}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-600">{ticket.kilometraje_actual.toLocaleString()} km</span>
                            </td>
                            <td className="py-4 px-4">
                              {getRendimientoBadge(ticket.rendimiento)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button variant="ghost" size="sm" onClick={() => alert("Eliminar ticket")}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Consumibles Tab */}
              {activeTab === "consumibles" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Inventario de Consumibles</h2>
                      <p className="text-sm text-slate-600">{consumibles.length} ítems en stock</p>
                    </div>
                    <Button onClick={() => setIsAddConsumibleOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Consumible
                    </Button>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Nombre</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Categoría</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Cantidad</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Stock Mínimo</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consumibles.map((consumible) => (
                          <tr 
                            key={consumible.id} 
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedConsumible(consumible)}
                          >
                            <td className="py-4 px-4">
                              <span className="text-sm font-medium text-slate-900">{consumible.nombre}</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">{consumible.categoria}</Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-900">{consumible.cantidad} {consumible.unidad}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-600">{consumible.stock_minimo}</span>
                            </td>
                            <td className="py-4 px-4">
                              {consumible.cantidad <= consumible.stock_minimo ? (
                                <Badge className="bg-red-500 text-white">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Bajo Stock
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500 text-white">OK</Badge>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
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
            </>
          )}
        </div>
      </div>

      {/* Dialog: Agregar Vehículo */}
      <Dialog open={isAddVehiculoOpen} onOpenChange={setIsAddVehiculoOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Nuevo Vehículo</DialogTitle>
            <DialogDescription>Registra un nuevo vehículo en la flota</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patente *</Label>
                <Input
                  placeholder="AA123BB"
                  value={newVehiculo.patente || ""}
                  onChange={(e) => setNewVehiculo({ ...newVehiculo, patente: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={newVehiculo.tipo} onValueChange={(value) => setNewVehiculo({ ...newVehiculo, tipo: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Camioneta" className="cursor-pointer hover:bg-slate-100">Camioneta</SelectItem>
                    <SelectItem value="Auto" className="cursor-pointer hover:bg-slate-100">Auto</SelectItem>
                    <SelectItem value="Camion" className="cursor-pointer hover:bg-slate-100">Camión</SelectItem>
                    <SelectItem value="Moto" className="cursor-pointer hover:bg-slate-100">Moto</SelectItem>
                    <SelectItem value="Otro" className="cursor-pointer hover:bg-slate-100">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Input
                  placeholder="Toyota"
                  value={newVehiculo.marca || ""}
                  onChange={(e) => setNewVehiculo({ ...newVehiculo, marca: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input
                  placeholder="Hilux"
                  value={newVehiculo.modelo || ""}
                  onChange={(e) => setNewVehiculo({ ...newVehiculo, modelo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Año *</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={newVehiculo.año || ""}
                  onChange={(e) => setNewVehiculo({ ...newVehiculo, año: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje Actual</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newVehiculo.kilometraje || ""}
                  onChange={(e) => setNewVehiculo({ ...newVehiculo, kilometraje: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVehiculoOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateVehiculo} className="bg-blue-600 hover:bg-blue-700">Guardar Vehículo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Carga */}
      <Dialog open={isAddTicketOpen} onOpenChange={setIsAddTicketOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Registrar Carga de Combustible</DialogTitle>
            <DialogDescription>Ingresa los datos de la carga</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Vehículo *</Label>
              <Select value={newTicket.vehiculo_id} onValueChange={(value) => setNewTicket({ ...newTicket, vehiculo_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="cursor-pointer hover:bg-slate-100">{v.patente} - {v.marca} {v.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={newTicket.fecha || ""}
                onChange={(e) => setNewTicket({ ...newTicket, fecha: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Litros *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="45"
                  value={newTicket.litros || ""}
                  onChange={(e) => setNewTicket({ ...newTicket, litros: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Total *</Label>
                <Input
                  type="number"
                  placeholder="9000"
                  value={newTicket.precio_total || ""}
                  onChange={(e) => setNewTicket({ ...newTicket, precio_total: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kilometraje Actual *</Label>
              <Input
                type="number"
                placeholder="45000"
                value={newTicket.kilometraje_actual || ""}
                onChange={(e) => setNewTicket({ ...newTicket, kilometraje_actual: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTicketOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTicket} className="bg-blue-600 hover:bg-blue-700">Registrar Carga</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Cargas Múltiples */}
      <Dialog open={isAddMultipleTicketsOpen} onOpenChange={setIsAddMultipleTicketsOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Cargas Múltiples</DialogTitle>
            <DialogDescription>Agrega varias cargas de combustible simultáneamente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {multipleTickets.map((ticket, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-slate-700">Carga #{index + 1}</h4>
                  {multipleTickets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newTickets = multipleTickets.filter((_, i) => i !== index);
                        setMultipleTickets(newTickets);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={ticket.fecha || ""}
                      onChange={(e) => {
                        const newTickets = [...multipleTickets];
                        newTickets[index] = { ...newTickets[index], fecha: e.target.value };
                        setMultipleTickets(newTickets);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehículo *</Label>
                    <Select
                      value={ticket.vehiculo_id || ""}
                      onValueChange={(value) => {
                        const newTickets = [...multipleTickets];
                        newTickets[index] = { ...newTickets[index], vehiculo_id: value };
                        setMultipleTickets(newTickets);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona vehículo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {vehiculos.map((v) => (
                          <SelectItem key={v.id} value={v.id} className="cursor-pointer hover:bg-slate-100">
                            {v.patente} - {v.marca} {v.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Litros *</Label>
                    <Input
                      type="number"
                      placeholder="45"
                      value={ticket.litros || ""}
                      onChange={(e) => {
                        const newTickets = [...multipleTickets];
                        newTickets[index] = { ...newTickets[index], litros: parseFloat(e.target.value) };
                        setMultipleTickets(newTickets);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Total *</Label>
                    <Input
                      type="number"
                      placeholder="9000"
                      value={ticket.precio_total || ""}
                      onChange={(e) => {
                        const newTickets = [...multipleTickets];
                        newTickets[index] = { ...newTickets[index], precio_total: parseFloat(e.target.value) };
                        setMultipleTickets(newTickets);
                      }}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Kilometraje Actual *</Label>
                    <Input
                      type="number"
                      placeholder="45000"
                      value={ticket.kilometraje_actual || ""}
                      onChange={(e) => {
                        const newTickets = [...multipleTickets];
                        newTickets[index] = { ...newTickets[index], kilometraje_actual: parseInt(e.target.value) };
                        setMultipleTickets(newTickets);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setMultipleTickets([...multipleTickets, { fecha: new Date().toISOString().split('T')[0] }]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Otra Carga
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddMultipleTicketsOpen(false);
              setMultipleTickets([{ fecha: new Date().toISOString().split('T')[0] }]);
            }}>Cancelar</Button>
            <Button
              onClick={async () => {
                try {
                  // TODO: Implementar batch create en backend
                  for (const ticket of multipleTickets) {
                    if (ticket.vehiculo_id && ticket.fecha && ticket.litros && ticket.precio_total && ticket.kilometraje_actual) {
                      await invoke("create_ticket", {
                        data: {
                          vehiculo_id: ticket.vehiculo_id,
                          fecha: ticket.fecha,
                          litros: ticket.litros,
                          precio_total: ticket.precio_total,
                          kilometraje_actual: ticket.kilometraje_actual,
                        }
                      });
                    }
                  }
                  alert("Cargas registradas exitosamente");
                  setIsAddMultipleTicketsOpen(false);
                  setMultipleTickets([{ fecha: new Date().toISOString().split('T')[0] }]);
                  loadData();
                } catch (error) {
                  alert("Error al registrar cargas: " + error);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Registrar {multipleTickets.length} Carga{multipleTickets.length > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Consumible */}
      <Dialog open={isAddConsumibleOpen} onOpenChange={setIsAddConsumibleOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nuevo Consumible</DialogTitle>
            <DialogDescription>Registra un nuevo ítem en el inventario</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Aceite 15W40"
                value={newConsumible.nombre || ""}
                onChange={(e) => setNewConsumible({ ...newConsumible, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Input
                placeholder="Lubricantes"
                value={newConsumible.categoria || ""}
                onChange={(e) => setNewConsumible({ ...newConsumible, categoria: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={newConsumible.cantidad || ""}
                  onChange={(e) => setNewConsumible({ ...newConsumible, cantidad: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={newConsumible.unidad} onValueChange={(value) => setNewConsumible({ ...newConsumible, unidad: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Unidad" className="cursor-pointer hover:bg-slate-100">Unidad</SelectItem>
                    <SelectItem value="Litros" className="cursor-pointer hover:bg-slate-100">Litros</SelectItem>
                    <SelectItem value="Kilogramos" className="cursor-pointer hover:bg-slate-100">Kilogramos</SelectItem>
                    <SelectItem value="Metros" className="cursor-pointer hover:bg-slate-100">Metros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stock Mínimo</Label>
              <Input
                type="number"
                placeholder="10"
                value={newConsumible.stock_minimo || ""}
                onChange={(e) => setNewConsumible({ ...newConsumible, stock_minimo: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddConsumibleOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateConsumible} className="bg-blue-600 hover:bg-blue-700">Guardar Consumible</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles de Vehículo */}
      <Dialog open={!!selectedVehiculo} onOpenChange={() => setSelectedVehiculo(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Detalles del Vehículo</DialogTitle>
            <DialogDescription>Información completa del vehículo seleccionado</DialogDescription>
          </DialogHeader>
          {selectedVehiculo && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Patente</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{selectedVehiculo.patente}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Estado</p>
                  <Badge className={selectedVehiculo.estado === "Activo" ? "bg-emerald-500" : "bg-amber-500"}>
                    {selectedVehiculo.estado}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Marca</p>
                  <p className="text-base text-slate-900">{selectedVehiculo.marca}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Modelo</p>
                  <p className="text-base text-slate-900">{selectedVehiculo.modelo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Tipo</p>
                  <Badge variant="secondary">{selectedVehiculo.tipo}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Año</p>
                  <p className="text-base text-slate-900">{selectedVehiculo.año}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium text-slate-500">Kilometraje Actual</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedVehiculo.kilometraje.toLocaleString()} km</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-slate-500">Creado: {new Date(selectedVehiculo.created_at).toLocaleString('es-AR')}</p>
                <p className="text-xs text-slate-500">Última actualización: {new Date(selectedVehiculo.updated_at).toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVehiculo(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles de Ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Detalles de Carga</DialogTitle>
            <DialogDescription>Información completa del registro de combustible</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Fecha</p>
                  <p className="text-base text-slate-900">{formatDate(selectedTicket.fecha)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Vehículo</p>
                  <p className="text-base font-mono font-semibold text-slate-900">{selectedTicket.vehiculo_patente}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Litros Cargados</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedTicket.litros} L</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Precio Total</p>
                  <p className="text-2xl font-bold text-emerald-600">${selectedTicket.precio_total.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Precio por Litro</p>
                  <p className="text-base text-slate-900">${(selectedTicket.precio_total / selectedTicket.litros).toFixed(2)}/L</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Kilometraje</p>
                  <p className="text-base text-slate-900">{selectedTicket.kilometraje_actual.toLocaleString()} km</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium text-slate-500">Rendimiento</p>
                  <div className="flex items-center gap-2">
                    {getRendimientoBadge(selectedTicket.rendimiento)}
                    <span className="text-sm text-slate-600">
                      ({selectedTicket.rendimiento > 10 ? 'Excelente' : selectedTicket.rendimiento > 7 ? 'Bueno' : 'Revisar'})
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-slate-500">Registrado: {new Date(selectedTicket.created_at).toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles de Consumible */}
      <Dialog open={!!selectedConsumible} onOpenChange={() => setSelectedConsumible(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Detalles del Consumible</DialogTitle>
            <DialogDescription>Información completa del artículo de inventario</DialogDescription>
          </DialogHeader>
          {selectedConsumible && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium text-slate-500">Nombre</p>
                  <p className="text-xl font-semibold text-slate-900">{selectedConsumible.nombre}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Categoría</p>
                  <Badge variant="secondary" className="text-sm">{selectedConsumible.categoria}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Unidad</p>
                  <p className="text-base text-slate-900">{selectedConsumible.unidad}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Cantidad Actual</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-600">{selectedConsumible.cantidad}</p>
                    {selectedConsumible.cantidad <= selectedConsumible.stock_minimo && (
                      <Badge className="bg-red-500 text-white">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Stock Bajo
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Stock Mínimo</p>
                  <p className="text-base text-slate-900">{selectedConsumible.stock_minimo} {selectedConsumible.unidad}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-slate-500">Creado: {new Date(selectedConsumible.created_at).toLocaleString('es-AR')}</p>
                <p className="text-xs text-slate-500">Última actualización: {new Date(selectedConsumible.updated_at).toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConsumible(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
