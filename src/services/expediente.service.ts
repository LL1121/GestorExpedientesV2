// Servicio para comunicarse con el backend de Tauri
import { invoke } from "@tauri-apps/api/core";
import type { Expediente, CreateExpedienteInput, UpdateExpedienteInput } from "@/types/expediente";

export class ExpedienteService {
  static async getAll(): Promise<Expediente[]> {
    try {
      const expedientes = await invoke<Expediente[]>("get_expedientes");
      return expedientes;
    } catch (error) {
      console.error("Error obteniendo expedientes:", error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Expediente> {
    try {
      const expediente = await invoke<Expediente>("get_expediente", { id });
      return expediente;
    } catch (error) {
      console.error(`Error obteniendo expediente ${id}:`, error);
      throw error;
    }
  }

  static async create(data: CreateExpedienteInput): Promise<Expediente> {
    try {
      const expediente = await invoke<Expediente>("create_expediente", { data });
      return expediente;
    } catch (error) {
      console.error("Error creando expediente:", error);
      throw error;
    }
  }

  static async update(id: string, data: UpdateExpedienteInput): Promise<Expediente> {
    try {
      const expediente = await invoke<Expediente>("update_expediente", { id, data });
      return expediente;
    } catch (error) {
      console.error(`Error actualizando expediente ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await invoke("delete_expediente", { id });
    } catch (error) {
      console.error(`Error eliminando expediente ${id}:`, error);
      throw error;
    }
  }

  static async search(query: string): Promise<Expediente[]> {
    try {
      const expedientes = await invoke<Expediente[]>("search_expedientes", { query });
      return expedientes;
    } catch (error) {
      console.error("Error buscando expedientes:", error);
      throw error;
    }
  }
}
