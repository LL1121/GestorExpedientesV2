export interface ConfigTope {
  id: number;
  tipo_contratacion: string;
  monto_maximo: number;
}

export interface ExpedienteOCData {
  id: string;
  numero: string;
  año: number;
  asunto: string;
  nro_infogov?: string | null;
  nro_gde?: string | null;
  caratula?: string | null;
  resolucion_nro?: string | null;
  // Campos específicos para OC
  oc_señor?: string | null;
  oc_domicilio?: string | null;
  oc_cuit?: string | null;
  oc_descripcion_zona?: string | null;
  oc_forma_pago?: string | null;
  oc_plazo_entrega?: string | null;
}

export interface NuevaOCPreparada {
  expediente: ExpedienteOCData;
  numero_oc: string;
  pedido_nro: number;
  fecha: string;
  destino: string;
  forma_pago: string;
  plazo_entrega: string;
  es_iva_inscripto: boolean;
  tipo_contratacion: string;
  subtotal: number;
  iva: number;
  total: number;
  total_en_letras: string;
}

export interface CreateRenglon {
  cantidad: number;
  detalle: string;
  marca?: string;
  valor_unitario: number;
}

export interface CreateOrdenCompra {
  destino?: string;
  expediente_id: string;
  resolucion_nro?: string;
  forma_pago: string;
  plazo_entrega?: string;
  es_iva_inscripto: boolean;
  renglones: CreateRenglon[];
}
