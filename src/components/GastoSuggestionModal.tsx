import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { CategoriaGasto } from "@/types/expediente";

interface GastoSuggestionModalProps {
  open: boolean;
  categoria: CategoriaGasto | null;
  patente: string | null;
  palabras_clave: string[];
  onConfirm: (categoria: CategoriaGasto, vehiculoId: string | null) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GastoSuggestionModal({
  open,
  categoria,
  patente,
  palabras_clave,
  onConfirm,
  onCancel,
  isLoading = false,
}: GastoSuggestionModalProps) {
  const getCategoryLabel = (cat: CategoriaGasto | null): string => {
    if (!cat) return "Otros";
    switch (cat) {
      case "Combustible":
        return "🛢️ Combustible";
      case "Repuestos":
        return "🔧 Repuestos";
      case "Mantenimiento":
        return "🔨 Mantenimiento";
      default:
        return "📦 Otros";
    }
  };

  const getCategoryColor = (cat: CategoriaGasto | null): string => {
    if (!cat) return "bg-gray-100 border-gray-300";
    switch (cat) {
      case "Combustible":
        return "bg-blue-100 border-blue-300";
      case "Repuestos":
        return "bg-orange-100 border-orange-300";
      case "Mantenimiento":
        return "bg-red-100 border-red-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const handleConfirm = () => {
    if (categoria) {
      onConfirm(categoria, patente || null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-white dark:bg-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Clasificación de Gasto
          </DialogTitle>
          <DialogDescription>
            Se detectó el tipo de gasto en este expediente
          </DialogDescription>
        </DialogHeader>

        {categoria && (
          <div className="space-y-4 py-4">
            {/* Categoría detectada */}
            <div className={`p-4 rounded-lg border-2 ${getCategoryColor(categoria)}`}>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {getCategoryLabel(categoria)}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Este expediente ha sido clasificado como un gasto de {categoria.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Palabras clave detectadas */}
            {palabras_clave.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Palabras clave detectadas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {palabras_clave.slice(0, 5).map((palabra, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {palabra}
                    </span>
                  ))}
                  {palabras_clave.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      +{palabras_clave.length - 5} más
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Vehículo detectado */}
            {patente && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  🚗 Patente detectada: <span className="font-mono">{patente}</span>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Este gasto será vinculado al vehículo con esta patente
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!categoria || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Guardando..." : "Confirmar y Vincular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
