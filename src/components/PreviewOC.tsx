import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NuevaOCPreparada, CreateRenglon } from "@/types/orden_compra";
import { ArrowLeft, Download, Loader2, CheckCircle, XCircle, Plus, Trash2, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PreviewOCProps {
  data: NuevaOCPreparada;
  renglones: CreateRenglon[];
  onBack: () => void;
  onGeneratePDF: (editedData: any) => void;
  onGenerateExcel: (editedData: any) => void;
  isGenerating?: boolean;
  generationStatus?: 'idle' | 'loading' | 'success' | 'error';
}

export default function PreviewOC({ data, renglones: initialRenglones, onBack, onGeneratePDF, onGenerateExcel, isGenerating = false, generationStatus = 'idle' }: PreviewOCProps) {
  const [editedData, setEditedData] = useState({
    numeroOC: data.numero_oc,
    pedidoNro: data.pedido_nro,
    destino: data.destino,
    fecha: data.fecha,
    señor: data.expediente.oc_señor || data.expediente.nro_infogov || "",
    domicilio: data.expediente.oc_domicilio || "",
    cuit: data.expediente.oc_cuit || "",
    descripcionZona: data.expediente.oc_descripcion_zona || "",
    formaPago: data.forma_pago,
    plazoEntrega: data.plazo_entrega,
  });

  const [renglones, setRenglones] = useState<CreateRenglon[]>(initialRenglones);

  const subtotal = renglones.reduce((acc, r) => acc + r.cantidad * r.valor_unitario, 0);
  const iva = subtotal * (data.es_iva_inscripto ? 0.21 : 0.105);
  const total = subtotal + iva;

  const updateField = (field: string, value: string | number) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const updateRenglon = (index: number, updates: Partial<CreateRenglon>) => {
    setRenglones((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const addRenglon = () => {
    setRenglones((prev) => [
      ...prev,
      {
        cantidad: 0,
        detalle: "",
        marca: "",
        valor_unitario: 0,
      },
    ]);
  };

  const removeRenglon = (index: number) => {
    setRenglones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePDF = () => {
    if (isGenerating) return;
    onGeneratePDF({ ...editedData, renglones, subtotal, iva, total });
  };

  const handleGenerateExcel = () => {
    if (isGenerating) return;
    onGenerateExcel({ ...editedData, renglones, subtotal, iva, total });
  };

  return (
    <div className="space-y-4 p-6 bg-slate-100 min-h-screen">
      {/* Botones de acción */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Editar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="gap-2 min-w-[200px] transition-all duration-300"
              disabled={isGenerating || generationStatus === 'success'}
              variant={generationStatus === 'success' ? 'default' : generationStatus === 'error' ? 'destructive' : 'default'}
            >
              <span className="inline-flex items-center gap-2 transition-all duration-300">
                {generationStatus === 'loading' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {generationStatus === 'success' && (
                  <CheckCircle className="h-4 w-4 animate-in zoom-in duration-300" />
                )}
                {generationStatus === 'error' && (
                  <XCircle className="h-4 w-4 animate-in zoom-in duration-300" />
                )}
                {generationStatus === 'idle' && (
                  <Download className="h-4 w-4" />
                )}
                {generationStatus === 'loading' && 'Generando...'}
                {generationStatus === 'success' && 'Generado correctamente'}
                {generationStatus === 'error' && 'Error al generar'}
                {generationStatus === 'idle' && 'Generar'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg">
            <DropdownMenuItem
              disabled={isGenerating}
              onClick={handleGenerateExcel}
              className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Generar Excel
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isGenerating}
              onClick={handleGeneratePDF}
              className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Simulación del Excel */}
      <div className="bg-white shadow-lg p-0 print:shadow-none">
        <div className="p-6 space-y-4 border border-slate-300">
          
          {/* HEADER */}
          <div className="grid grid-cols-3 gap-4 items-start pb-4 border-b-2 border-slate-300">
            <div className="col-span-1">
              <h1 className="text-3xl font-bold text-blue-600">IRRIGACIÓN</h1>
            </div>
            <div className="col-span-1 text-center">
              <p className="text-2xl font-bold">ORIGINAL</p>
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Encabezado del departamento */}
          <div className="grid grid-cols-3 gap-4 items-start pb-4">
            <div className="col-span-2">
              <div className="bg-gray-300 border-2 border-black p-3 text-center space-y-1">
                <p className="font-bold text-sm">DEPARTAMENTO GENERAL DE IRRIGACIÓN</p>
                <p className="font-bold text-sm">C.U.I.T. 30-99916963-1</p>
              </div>
            </div>
            <div className="col-span-1 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <label className="font-bold whitespace-nowrap">ORDEN DE COMPRA N°:</label>
                <Input 
                  value={editedData.numeroOC} 
                  onChange={(e) => updateField("numeroOC", e.target.value)} 
                  className="h-6 text-xs border-0 border-b border-black rounded-none px-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold whitespace-nowrap">PEDIDO N°:</label>
                <Input 
                  value={editedData.pedidoNro} 
                  onChange={(e) => updateField("pedidoNro", e.target.value)} 
                  className="h-6 text-xs border-0 border-b border-black rounded-none px-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold">DESTINO:</label>
                <Input 
                  value={editedData.destino.toUpperCase()} 
                  onChange={(e) => updateField("destino", e.target.value)} 
                  className="h-6 text-xs border-0 border-b border-black rounded-none px-1 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Datos administrativos */}
          <div className="space-y-1 text-sm pb-4 border-b border-slate-300">
            <div className="flex gap-2">
              <label className="font-bold">Expte. N°</label>
              <Input 
                value={editedData.numeroOC} 
                onChange={(e) => updateField("numeroOC", e.target.value)} 
                className="h-5 text-xs border-0 border-b border-black rounded-none px-1 flex-1"
              />
            </div>
            <div className="flex gap-2">
              <label className="font-bold">Resolución interna N°</label>
              <Input 
                value={editedData.numeroOC} 
                onChange={(e) => updateField("numeroOC", e.target.value)} 
                className="h-5 text-xs border-0 border-b border-black rounded-none px-1 flex-1"
              />
            </div>
          </div>

          {/* Datos del Proveedor */}
          <div className="space-y-1 text-sm pb-4 border-b border-slate-300">
            <div className="flex gap-2 items-center">
              <label className="font-bold">SEÑOR/ES:</label>
              <Input 
                value={editedData.señor} 
                onChange={(e) => updateField("señor", e.target.value)} 
                className="h-5 text-xs border-0 border-b border-black rounded-none px-1 flex-1"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="font-bold">DOMICILIO:</label>
              <Input 
                value={editedData.domicilio} 
                onChange={(e) => updateField("domicilio", e.target.value)} 
                className="h-5 text-xs border-0 border-b border-black rounded-none px-1 flex-1"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="font-bold">CUIT:</label>
              <Input 
                value={editedData.cuit} 
                onChange={(e) => updateField("cuit", e.target.value)} 
                className="h-5 text-xs border-0 border-b border-black rounded-none px-1 flex-1"
              />
            </div>
          </div>

          {/* Descripción zona */}
          <div className="space-y-2 pb-4 text-xs">
            <p className="text-justify leading-tight">De acuerdo con la propuesta presentada por ustedes y las reservas consignadas en la presente Orden de Compra, sírvase proveer por cuenta de este Departamento General de Irrigación los artículos que abajo se detallan, debiendo entregarse en:</p>
            <Textarea 
              value={editedData.descripcionZona} 
              onChange={(e) => updateField("descripcionZona", e.target.value)} 
              className="w-full h-12 text-xs border border-black p-2 font-bold"
            />
          </div>

          {/* Texto descriptivo */}
          <div className="pb-4 border-b border-slate-300 text-xs text-justify leading-tight">
            <p>Esta firma deberá presentar la Factura original tipo "B" o "C" según corresponda en la oficina de ZONA RIEGO MALARGUE, sito en Avda. San Martín 258 - Malargue - Mendoza, acompañada del Remito y esta Orden de Compra, con la constancia de haber tributado el IMPUESTO DE SELLOS correspondiente según lo establecido por la legislación vigente. En caso de estar EXENTO en el pago de dicho impuesto, deberá adjuntar la respectiva constancia de exención, debidamente actualizada. Esta documentación y los pagos respectivos quedarán sujetos a lo establecido en el Reglamento de Compras.</p>
          </div>

          {/* TABLA DE RENGLONES */}
          <div className="pb-4">
            <table className="w-full border-2 border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 text-center font-bold">Renglón Nro.</th>
                  <th className="border border-black p-2 text-center font-bold">Cantidad</th>
                  <th className="border border-black p-2 text-center font-bold">CONCEPTO / DETALLE</th>
                  <th className="border border-black p-2 text-center font-bold">Marca</th>
                  <th className="border border-black p-2 text-center font-bold">Valor Unitario</th>
                  <th className="border border-black p-2 text-center font-bold">Totales</th>
                </tr>
              </thead>
              <tbody>
                {renglones.map((r, idx) => (
                  <tr key={idx} className="relative hover:bg-blue-50 transition-colors">
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-1">
                      <Input 
                        type="number" 
                        min={0}
                        step={0.01}
                        value={r.cantidad} 
                        onChange={(e) => updateRenglon(idx, { cantidad: Number(e.target.value) })} 
                        className="h-6 text-xs border-0 rounded-none px-1 w-full"
                      />
                    </td>
                    <td className="border border-black p-1">
                      <Textarea 
                        value={r.detalle} 
                        onChange={(e) => updateRenglon(idx, { detalle: e.target.value })} 
                        className="h-16 text-xs border-0 rounded-none px-1 resize-none"
                      />
                    </td>
                    <td className="border border-black p-1">
                      <Input 
                        value={r.marca || ""} 
                        onChange={(e) => updateRenglon(idx, { marca: e.target.value })} 
                        className="h-6 text-xs border-0 rounded-none px-1 w-full"
                      />
                    </td>
                    <td className="border border-black p-1">
                      <Input 
                        type="number" 
                        min={0}
                        step={0.01}
                        value={r.valor_unitario} 
                        onChange={(e) => updateRenglon(idx, { valor_unitario: Number(e.target.value) })} 
                        className="h-6 text-xs border-0 rounded-none px-1 w-full text-right"
                      />
                    </td>
                    <td className="border border-black p-2 text-right font-semibold">
                      ${(r.cantidad * r.valor_unitario).toFixed(2)}
                    </td>
                    <td className="absolute -right-10 top-0 h-full flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRenglon(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* TOTAL ROW */}
            <div className="border-2 border-t-0 border-black p-2 text-xs flex justify-end items-center gap-4">
              <span className="font-bold">TOTAL:</span>
              <div className="border border-black p-1 min-w-20 text-right font-semibold">
                $ {total.toFixed(2)}
              </div>
            </div>

            {/* Botón agregar renglón */}
            <div className="mt-2">
              <Button onClick={addRenglon} size="sm" variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Renglón
              </Button>
            </div>
          </div>

          {/* Son Pesos y Forma de Pago */}
          <div className="space-y-1 text-sm pb-4 border-b border-slate-300">
            <div className="flex gap-2 items-center">
              <label className="font-bold">Son Pesos:</label>
              <Input 
                value={data.total_en_letras} 
                readOnly
                className="h-6 text-xs border border-black rounded-none px-1 flex-1 bg-gray-100"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="font-bold">Forma de Pago:</label>
              <Input 
                value={editedData.formaPago} 
                onChange={(e) => updateField("formaPago", e.target.value)} 
                className="h-6 text-xs border border-black rounded-none px-1 flex-1"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="font-bold">Plazo de Entrega:</label>
              <Input 
                value={editedData.plazoEntrega} 
                onChange={(e) => updateField("plazoEntrega", e.target.value)} 
                className="h-6 text-xs border border-black rounded-none px-1 flex-1"
              />
            </div>
          </div>

          {/* Nota */}
          <div className="bg-gray-200 p-2 text-xs font-semibold">
            * Se deberá adjuntar con la factura, la Orden de Compra Original sellada y Copia de Ingresos Varios*
          </div>

          {/* IVA RESPONSABLE INSCRIPTO */}
          <div className="pb-4">
            <table className="w-full border-2 border-black text-xs">
              <thead>
                <tr>
                  <th colSpan={3} className="border border-black p-2 text-center font-bold bg-gray-300">
                    IVA RESPONSABLE INSCRIPTO
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2">Importe Neto Gravado</td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2 text-right font-semibold">$ {subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2">I.V.A. {data.es_iva_inscripto ? "21%" : "10,50%"}</td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2 text-right font-semibold">$ {iva.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">TOTAL</td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2 text-right font-bold">$ {total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Botones de acción finales */}
      <div className="flex justify-end gap-2 bg-white p-4 rounded-lg shadow-sm">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="gap-2 min-w-[200px] transition-all duration-300"
              disabled={isGenerating || generationStatus === 'success'}
            >
              <span className="inline-flex items-center gap-2">
                {generationStatus === 'loading' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {generationStatus === 'success' && (
                  <CheckCircle className="h-4 w-4 animate-in zoom-in duration-300" />
                )}
                {generationStatus === 'error' && (
                  <XCircle className="h-4 w-4 animate-in zoom-in duration-300" />
                )}
                {generationStatus === 'idle' && (
                  <Download className="h-4 w-4" />
                )}
                {generationStatus === 'loading' && 'Generando...'}
                {generationStatus === 'success' && 'Generado correctamente'}
                {generationStatus === 'error' && 'Error al generar'}
                {generationStatus === 'idle' && 'Generar'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg">
            <DropdownMenuItem
              disabled={isGenerating}
              onClick={handleGenerateExcel}
              className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Generar Excel
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isGenerating}
              onClick={handleGeneratePDF}
              className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
