import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrdenCompraService } from "@/services/orden_compra.service";
import type { ConfigTope } from "@/types/orden_compra";

export default function ConfigTopes() {
  const [topes, setTopes] = useState<ConfigTope[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await OrdenCompraService.obtenerConfigTopes();
        setTopes(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateMonto = (id: number, monto: number) => {
    setTopes((prev) => prev.map((t) => (t.id === id ? { ...t, monto_maximo: monto } : t)));
  };

  const saveTope = async (tope: ConfigTope) => {
    try {
      setSavingId(tope.id);
      const updated = await OrdenCompraService.actualizarConfigTope(tope.id, tope.monto_maximo);
      setTopes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Topes de Contratación</h3>
      <p className="text-sm text-slate-600 mt-1">Actualizá los montos máximos por tipo de contratación</p>

      {loading ? (
        <div className="mt-4 text-sm text-slate-500">Cargando topes...</div>
      ) : (
        <div className="mt-4 space-y-4">
          {topes.map((tope) => (
            <div key={tope.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-7">
                <Label>{tope.tipo_contratacion}</Label>
              </div>
              <div className="md:col-span-3">
                <Input
                  type="number"
                  value={tope.monto_maximo}
                  onChange={(e) => updateMonto(tope.id, Number(e.target.value))}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => saveTope(tope)}
                  disabled={savingId === tope.id}
                >
                  {savingId === tope.id ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
