import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NuevaOCPreparada, CreateRenglon } from "@/types/orden_compra";
import { ArrowLeft, Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface PreviewOCProps {
  data: NuevaOCPreparada;
  renglones: CreateRenglon[];
  onBack: () => void;
  onGeneratePDF: (editedData: any) => void;
  isGenerating?: boolean;
  generationStatus?: 'idle' | 'loading' | 'success' | 'error';
}

export default function PreviewOC({ data, renglones, onBack, onGeneratePDF, isGenerating = false, generationStatus = 'idle' }: PreviewOCProps) {
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

  const subtotal = renglones.reduce((acc, r) => acc + r.cantidad * r.valor_unitario, 0);
  const iva = subtotal * (data.es_iva_inscripto ? 0.21 : 0.105);
  const total = subtotal + iva;

  const updateField = (field: string, value: string | number) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = () => {
    if (isGenerating) return;
    onGeneratePDF({ ...editedData, renglones, subtotal, iva, total });
  };

  return (
    <div className="space-y-6 p-8 bg-white dark:bg-slate-800 rounded-lg">
      {/* Botones superiores */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Editar
        </Button>
        <Button 
          onClick={handleGeneratePDF} 
          className="gap-2 min-w-[180px] transition-all duration-300" 
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
            {generationStatus === 'idle' && 'Generar PDF'}
          </span>
        </Button>
      </div>

      {/* Vista previa del documento */}
      <div className="border-2 border-slate-300 p-12 bg-white space-y-6 print:border-0">
        {/* Encabezado */}
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">IRRIGACIÓN</h1>
              <p className="text-sm">ORIGINAL</p>
            </div>
            <div className="text-right space-y-1 text-sm">
              <div>ORDEN DE COMPRA N°: <Input value={editedData.numeroOC} onChange={(e) => updateField("numeroOC", e.target.value)} className="inline-block w-16 h-6 text-xs" /></div>
              <div>PEDIDO N°: <Input value={editedData.pedidoNro} onChange={(e) => updateField("pedidoNro", e.target.value)} className="inline-block w-16 h-6 text-xs" /></div>
              <div>DESTINO: <Input value={editedData.destino} onChange={(e) => updateField("destino", e.target.value)} className="inline-block w-40 h-6 text-xs" /></div>
            </div>
          </div>
          <div className="border border-black p-2 text-center text-sm">
            <p className="font-semibold">DEPARTAMENTO GENERAL DE IRRIGACIÓN</p>
            <p>C.U.I.T. 30-99916963-1</p>
          </div>
        </div>

        {/* Datos del expediente */}
        <div className="text-sm space-y-1">
          <p><strong>Expte. N°:</strong> {data.expediente.numero}-{data.expediente.año}</p>
          <p><strong>Resolución interna N°:</strong> {data.expediente.resolucion_nro || "-"}</p>
          <p><strong>Tipo de Contratación:</strong> {data.tipo_contratacion}</p>
          <p><strong>Fecha:</strong> Mendoza, <Input value={editedData.fecha} onChange={(e) => updateField("fecha", e.target.value)} className="inline-block w-40 h-6 text-xs" /></p>
        </div>

        {/* Proveedor */}
        <div className="text-sm space-y-1">
          <div>
            <strong>SEÑOR/ES:</strong>
            <Input value={editedData.señor} onChange={(e) => updateField("señor", e.target.value)} placeholder="Nombre del proveedor" className="w-full mt-1 bg-slate-50" />
          </div>
          <div>
            <strong>DOMICILIO:</strong>
            <Input value={editedData.domicilio} onChange={(e) => updateField("domicilio", e.target.value)} placeholder="Domicilio" className="w-full mt-1 bg-slate-50" />
          </div>
          <div>
            <strong>CUIT:</strong>
            <Input value={editedData.cuit} onChange={(e) => updateField("cuit", e.target.value)} placeholder="CUIT" className="w-full mt-1 bg-slate-50" />
          </div>
        </div>

        {/* Descripción de zona */}
        <div className="text-sm">
          <strong>Descripción:</strong>
          <Textarea value={editedData.descripcionZona} onChange={(e) => updateField("descripcionZona", e.target.value)} className="w-full mt-1 bg-slate-50 text-xs" rows={3} />
        </div>

        {/* Tabla de renglones */}
        <table className="w-full border border-black text-xs">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black p-2 text-left">Renglón Nro.</th>
              <th className="border-r border-black p-2 text-left">Cantidad</th>
              <th className="border-r border-black p-2 text-left">CONCEPTO / DETALLE</th>
              <th className="border-r border-black p-2 text-left">Marca</th>
              <th className="border-r border-black p-2 text-right">Valor Unitario</th>
              <th className="p-2 text-right">Totales</th>
            </tr>
          </thead>
          <tbody>
            {renglones.map((r, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border-r border-black p-2">{idx + 1}</td>
                <td className="border-r border-black p-2">{r.cantidad}</td>
                <td className="border-r border-black p-2">{r.detalle}</td>
                <td className="border-r border-black p-2">{r.marca || "-"}</td>
                <td className="border-r border-black p-2 text-right">${r.valor_unitario.toFixed(2)}</td>
                <td className="p-2 text-right">${(r.cantidad * r.valor_unitario).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="font-semibold border-black">
              <td colSpan={5} className="border-r border-black border-t-2 p-2 text-right">
                TOTAL:
              </td>
              <td className="border-t-2 p-2 text-right">${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Son pesos en letras */}
        <div className="text-sm">
          <p>
            <strong>Son Pesos:</strong> {data.total_en_letras}
          </p>
          <p>
            <strong>Forma de Pago:</strong> <Input value={editedData.formaPago} onChange={(e) => updateField("formaPago", e.target.value)} className="inline-block w-48 h-6 text-xs bg-slate-50" />
          </p>
          <p>
            <strong>Plazo de Entrega:</strong> <Input value={editedData.plazoEntrega} onChange={(e) => updateField("plazoEntrega", e.target.value)} className="inline-block w-32 h-6 text-xs bg-slate-50" />
          </p>
        </div>

        {/* IVA Responsable Inscripto */}
        <div className="border-2 border-black p-4">
          <h3 className="font-bold text-center mb-3 text-sm">IVA RESPONSABLE INSCRIPTO</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-black">
                <td className="p-2">Importe Neto Gravado</td>
                <td className="text-right p-2">${subtotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2">IVA {data.es_iva_inscripto ? "21%" : "10.5%"}</td>
                <td className="text-right p-2">${iva.toFixed(2)}</td>
              </tr>
              <tr className="font-bold">
                <td className="p-2">TOTAL</td>
                <td className="text-right p-2">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pie de página */}
        <div className="text-xs text-center border-t-2 border-black pt-4">
          <p>* Se deberá adjuntar con la factura, la Orden de Compra Original sellada y Copia de Ingresos Varios *</p>
        </div>
      </div>

      {/* Botón de generar PDF al final */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button 
          onClick={handleGeneratePDF} 
          className="gap-2 min-w-[180px] transition-all duration-300" 
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
            {generationStatus === 'idle' && 'Generar PDF'}
          </span>
        </Button>
      </div>
    </div>
  );
}
