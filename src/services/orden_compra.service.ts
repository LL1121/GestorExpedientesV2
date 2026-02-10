import { invoke } from "@tauri-apps/api/core";
import type { ConfigTope, CreateOrdenCompra, NuevaOCPreparada } from "@/types/orden_compra";

export class OrdenCompraService {
  static async prepararNuevaOC(expedienteId: string): Promise<NuevaOCPreparada> {
    return invoke<NuevaOCPreparada>("preparar_nueva_oc", { expedienteId });
  }

  static async obtenerConfigTopes(): Promise<ConfigTope[]> {
    return invoke<ConfigTope[]>("obtener_config_topes");
  }

  static async actualizarConfigTope(id: number, monto_maximo: number): Promise<ConfigTope> {
    return invoke<ConfigTope>("actualizar_config_tope", { data: { id, monto_maximo } });
  }

  static async crearOrdenCompra(data: CreateOrdenCompra) {
    return invoke("crear_orden_compra", { data });
  }
}
