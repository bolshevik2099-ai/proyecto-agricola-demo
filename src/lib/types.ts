// ==========================================================
// TIPOS DE DATOS DEL SISTEMA TAMFRESH
// ==========================================================

export type RolUsuario = 'admin' | 'supervisor';

export interface Usuario {
  id: number;
  nombre: string;
  rol: RolUsuario;
  pin: string;
  activo: boolean;
  created_at?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  variedad: string;
  unidad_base: string;
  descripcion: string;
  activo: boolean;
  created_at?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
  ciudad: string;
  rfc?: string;
  activo: boolean;
  created_at?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
  ubicacion_huerta: string;
  tipo_berry_principal: string;
  activo: boolean;
  created_at?: string;
}

export interface EmpaqueTipo {
  id: number;
  nombre: string;
  gramaje_g: number;
  material: string;
  capacidad_desc: string;
  activo: boolean;
  created_at?: string;
}

export type TipoMovimientoEmpaque = 'entrada_cliente' | 'salida_a_cliente' | 'ajuste';

export interface EmpaqueMovimiento {
  id: number;
  fecha: string;
  cliente_id: number;
  empaque_tipo_id: number;
  tipo_movimiento: TipoMovimientoEmpaque;
  cantidad: number;
  comprobante_url?: string;
  usuario_id?: number;
  notas?: string;
  created_at?: string;
  // Campos join opcionales
  cliente_nombre?: string;
  empaque_nombre?: string;
  usuario_nombre?: string;
}

export interface SaldoEmpaque {
  cliente_id: number;
  cliente_nombre: string;
  empaque_tipo_id: number;
  empaque_nombre: string;
  gramaje_g: number;
  material: string;
  total_recibido: number;
  total_entregado: number;
  total_ajustes: number;
  saldo_disponible: number;
}

export type UnidadMedida = 'kg' | 'caja' | 'charola' | 'cubeta' | 'tonelada';

export interface Compra {
  id: number;
  folio: string;
  fecha: string;
  proveedor_id: number;
  producto_id: number;
  unidad_medida: UnidadMedida;
  cantidad: number;
  precio_unitario: number;
  total: number;
  calidad: string;
  comprobante_url?: string;
  usuario_id?: number;
  notas?: string;
  created_at?: string;
  // Joins
  proveedor_nombre?: string;
  producto_nombre?: string;
  usuario_nombre?: string;
}

export type EstadoVenta = 'entregado' | 'pendiente_pago' | 'pagada' | 'cancelada';

export interface Venta {
  id: number;
  folio: string;
  fecha: string;
  cliente_id: number;
  producto_id: number;
  unidad_medida: UnidadMedida;
  cantidad: number;
  precio_unitario: number;
  total: number;
  empaque_tipo_id?: number;
  cajas_descontadas?: number;
  estado: EstadoVenta;
  comprobante_url?: string;
  usuario_id?: number;
  notas?: string;
  created_at?: string;
  // Joins
  cliente_nombre?: string;
  producto_nombre?: string;
  empaque_nombre?: string;
  usuario_nombre?: string;
}

export interface GastoCategoria {
  id: number;
  nombre: string;
  icono: string;
  activo: boolean;
}

export interface Gasto {
  id: number;
  fecha: string;
  categoria_id: number;
  concepto: string;
  monto: number;
  metodo_pago: string;
  comprobante_url?: string;
  usuario_id?: number;
  notas?: string;
  created_at?: string;
  // Joins
  categoria_nombre?: string;
  usuario_nombre?: string;
}
