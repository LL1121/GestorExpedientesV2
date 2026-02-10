import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import type { CreateRenglon, NuevaOCPreparada } from "@/types/orden_compra";
import { OrdenCompraService } from "@/services/orden_compra.service";

interface FormularioOCProps {
  data: NuevaOCPreparada;
  onBack: () => void;
}

const formasPago = ["Transferencia", "Efectivo", "Cheque", "Tarjeta"];

export default function FormularioOC({ data, onBack }: FormularioOCProps) {
  const [destino, setDestino] = useState(data.destino ?? "ZONA RIEGO MALARGUE");
  const [formaPago, setFormaPago] = useState(data.forma_pago ?? "Transferencia");
  const [plazoEntrega, setPlazoEntrega] = useState(data.plazo_entrega ?? "-");
  const [esIvaInscripto, setEsIvaInscripto] = useState(data.es_iva_inscripto);
  const [resolucionNro, setResolucionNro] = useState(data.expediente.resolucion_nro ?? "");
  const [renglones, setRenglones] = useState<CreateRenglon[]>([
    { cantidad: 1, detalle: "", marca: "", valor_unitario: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(
    () => renglones.reduce((acc, r) => acc + r.cantidad * r.valor_unitario, 0),
    [renglones]
  );
  const iva = useMemo(() => subtotal * (esIvaInscripto ? 0.21 : 0.105), [subtotal, esIvaInscripto]);
  const total = subtotal + iva;

  const updateRenglon = (index: number, patch: Partial<CreateRenglon>) => {
    setRenglones((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRenglon = () => {
    setRenglones((prev) => [...prev, { cantidad: 1, detalle: "", marca: "", valor_unitario: 0 }]);
  };

  const removeRenglon = (index: number) => {
    setRenglones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (!formaPago) return;
    if (renglones.some((r) => !r.detalle || r.cantidad <= 0 || r.valor_unitario <= 0)) return;

    try {
      setSaving(true);
      await OrdenCompraService.crearOrdenCompra({
        destino,
        expediente_id: data.expediente.id,
        resolucion_nro: resolucionNro || undefined,
        forma_pago: formaPago,
        plazo_entrega: plazoEntrega || "-",
        es_iva_inscripto: esIvaInscripto,
        renglones: renglones.map((r) => ({
          cantidad: r.cantidad,
          detalle: r.detalle,
          marca: r.marca || undefined,
          valor_unitario: r.valor_unitario,
        })),
      });
      alert("Orden de Compra creada correctamente");
      onBack();
    } catch (err) {
      alert("Error al crear OC: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Orden de Compra</h2>
          <p className="text-sm text-slate-600 mt-1">Generada desde el Expediente {data.expediente.numero}-{data.expediente.año}</p>
        </div>
        <Button variant="outline" onClick={onBack}>Volver</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Datos de la OC</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Número OC</Label>
                <Input value={data.numero_oc} disabled className="mt-2" />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input value={data.fecha} disabled className="mt-2" />
              </div>
              <div>
                <Label>Destino</Label>
                <Input value={destino} onChange={(e) => setDestino(e.target.value)} className="mt-2 bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <Label>Forma de Pago</Label>
                <Select value={formaPago} onValueChange={setFormaPago}>
                  <SelectTrigger className="mt-2 bg-slate-50 dark:bg-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    {formasPago.map((fp) => (
                      <SelectItem key={fp} value={fp} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                        {fp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plazo de entrega</Label>
                <Input value={plazoEntrega || "-"} onChange={(e) => setPlazoEntrega(e.target.value)} className="mt-2 bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <Label>Resolución N°</Label>
                <Input value={resolucionNro} onChange={(e) => setResolucionNro(e.target.value)} className="mt-2 bg-slate-50 dark:bg-slate-700" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Renglones</h3>
              <Button onClick={addRenglon} size="sm"><Plus className="h-4 w-4 mr-1" />Agregar</Button>
            </div>
            <div className="space-y-4">
              {renglones.map((r, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="md:col-span-2">
                    <Label>Cantidad</Label>
                    <Input type="number" min={0} value={r.cantidad} onChange={(e) => updateRenglon(index, { cantidad: Number(e.target.value) })} className="mt-2 bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div className="md:col-span-5">
                    <Label>Detalle</Label>
                    <Textarea value={r.detalle} onChange={(e) => updateRenglon(index, { detalle: e.target.value })} className="mt-2 bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Marca</Label>
                    <Input value={r.marca ?? ""} onChange={(e) => updateRenglon(index, { marca: e.target.value })} className="mt-2 bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Valor Unitario</Label>
                    <Input type="number" min={0} value={r.valor_unitario} onChange={(e) => updateRenglon(index, { valor_unitario: Number(e.target.value) })} className="mt-2 bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div className="md:col-span-1">
                    <Button variant="ghost" onClick={() => removeRenglon(index)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Resumen</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>IVA</span><span>${iva.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
              <div className="pt-2">
                <Badge variant="secondary">{data.tipo_contratacion}</Badge>
              </div>
            </div>
            <div className="mt-4">
              <Label>Total en letras</Label>
              <Textarea value={data.total_en_letras} readOnly className="mt-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <Label>IVA Inscripto</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button variant={esIvaInscripto ? "default" : "outline"} onClick={() => setEsIvaInscripto(true)}>
                21%
              </Button>
              <Button variant={!esIvaInscripto ? "default" : "outline"} onClick={() => setEsIvaInscripto(false)}>
                10.5%
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Orden de Compra"}
          </Button>
        </div>
      </div>
    </div>
  );
}
