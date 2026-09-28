'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Venta, Cliente, Producto, EmpaqueTipo, UnidadMedida, EstadoVenta } from '@/lib/types';
import { FileUpload } from '@/components/FileUpload';
import { 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  FileText, 
  X,
  Eye,
  PackageCheck,
  CreditCard,
  AlertCircle
} from 'lucide-react';

export default function VentasPage() {
  const { usuarioActual, isAdmin } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [empaques, setEmpaques] = useState<EmpaqueTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal para registrar venta
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteId, setClienteId] = useState<string>('');
  const [productoId, setProductoId] = useState<string>('');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>('kg');
  const [cantidad, setCantidad] = useState<string>('');
  const [precioUnitario, setPrecioUnitario] = useState<string>('');
  const [empaqueTipoId, setEmpaqueTipoId] = useState<string>('');
  const [cajasDescontadas, setCajasDescontadas] = useState<string>('');
  const [descontarEmpaque, setDescontarEmpaque] = useState(true);
  const [estado, setEstado] = useState<EstadoVenta>('entregado');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  // Modal foto
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Ventas
      const { data: vData } = await supabase
        .from('ventas')
        .select('*, clientes(nombre), productos(nombre), empaque_tipos(nombre), usuarios(nombre)')
        .order('fecha', { ascending: false })
        .limit(50);

      if (vData) {
        setVentas(
          vData.map((v) => ({
            ...v,
            cliente_nombre: v.clientes?.nombre,
            producto_nombre: v.productos?.nombre,
            empaque_nombre: v.empaque_tipos?.nombre,
            usuario_nombre: v.usuarios?.nombre,
          }))
        );
      }

      // 2. Clientes
      const { data: cData } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (cData) {
        setClientes(cData);
        if (cData.length > 0 && !clienteId) setClienteId(cData[0].id.toString());
      }

      // 3. Productos
      const { data: pData } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (pData) {
        setProductos(pData);
        if (pData.length > 0 && !productoId) setProductoId(pData[0].id.toString());
      }

      // 4. Empaques
      const { data: eData } = await supabase
        .from('empaque_tipos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (eData) setEmpaques(eData);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalCalculado = (Number(cantidad) || 0) * (Number(precioUnitario) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !productoId || !cantidad || Number(cantidad) <= 0 || !precioUnitario || Number(precioUnitario) < 0) {
      alert('Por favor verifica los datos de cantidad y precio.');
      return;
    }

    setGuardando(true);
    try {
      const folioGen = `VTA-${Date.now().toString().slice(-6)}`;
      const numCajas = cajasDescontadas ? parseInt(cajasDescontadas) : 0;
      const empId = empaqueTipoId ? parseInt(empaqueTipoId) : null;

      // 1. Insertar Venta
      const { data: ventaCreada, error: errVenta } = await supabase
        .from('ventas')
        .insert([
          {
            folio: folioGen,
            cliente_id: parseInt(clienteId),
            producto_id: parseInt(productoId),
            unidad_medida: unidadMedida,
            cantidad: parseFloat(cantidad),
            precio_unitario: parseFloat(precioUnitario),
            total: totalCalculado,
            empaque_tipo_id: empId,
            cajas_descontadas: numCajas,
            estado,
            comprobante_url: comprobanteUrl,
            usuario_id: usuarioActual?.id || null,
            notas: notas.trim(),
          },
        ])
        .select()
        .single();

      if (errVenta) throw errVenta;

      // 2. Si se utilizó empaque del cliente, registrar salida automática en empaque_movimientos
      if (descontarEmpaque && empId && numCajas > 0) {
        await supabase.from('empaque_movimientos').insert([
          {
            cliente_id: parseInt(clienteId),
            empaque_tipo_id: empId,
            tipo_movimiento: 'salida_a_cliente',
            cantidad: numCajas,
            comprobante_url: comprobanteUrl,
            usuario_id: usuarioActual?.id || null,
            notas: `Salida automática por venta ${folioGen} (${cantidad} ${unidadMedida})`,
          },
        ]);
      }

      // Limpiar y recargar
      setCantidad('');
      setPrecioUnitario('');
      setCajasDescontadas('');
      setEmpaqueTipoId('');
      setNotas('');
      setComprobanteUrl('');
      setModalAbierto(false);
      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar venta';
      alert('Error: ' + msg);
    } finally {
      setGuardando(false);
    }
  };

  const ventasFiltradas = ventas.filter((v) => {
    const texto = `${v.cliente_nombre} ${v.producto_nombre} ${v.folio} ${v.estado}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.total), 0);
  const totalKilosVendidos = ventas.reduce((acc, v) => acc + (v.unidad_medida === 'kg' ? Number(v.cantidad) : 0), 0);

  return (
    <main className="p-4 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Ventas de Fruta
          </h1>
          <p className="text-xs text-slate-500">Salidas a clientes, exportadoras y distribuidores</p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-200 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Nueva Venta
        </button>
      </div>

      {/* Resumen Superior si es Admin */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">Total Kilos Salidos</span>
            <span className="text-lg font-black text-slate-900">
              {totalKilosVendidos.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">Ingresos Totales</span>
            <span className="text-lg font-black text-emerald-600">
              ${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente o berry..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
        <button
          onClick={cargarDatos}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"
          title="Refrescar"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* LISTADO DE VENTAS */}
      <div className="space-y-2.5">
        {cargando && ventas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-xs">Cargando ventas de fruta...</p>
          </div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No hay ventas registradas que coincidan.
          </div>
        ) : (
          ventasFiltradas.map((v) => (
            <div
              key={v.id}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">{v.producto_nombre}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border capitalize ${
                        v.estado === 'pagada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : v.estado === 'pendiente_pago'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {v.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{v.cliente_nombre}</p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block">
                    {v.cantidad} {v.unidad_medida}
                  </span>
                  {isAdmin && (
                    <span className="text-xs font-bold text-emerald-700">
                      ${Number(v.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Info de Empaque Usado */}
              {v.empaque_nombre && v.cajas_descontadas ? (
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                    Empaque: {v.empaque_nombre}
                  </span>
                  <span className="font-bold text-slate-800">{v.cajas_descontadas} cajas</span>
                </div>
              ) : null}

              {/* Detalles y comprobante */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>
                  {isAdmin && `@$${Number(v.precio_unitario).toFixed(2)}/${v.unidad_medida} · `}
                  {new Date(v.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </span>

                <div className="flex items-center gap-2">
                  {v.comprobante_url && (
                    <button
                      onClick={() => setFotoModal(v.comprobante_url || null)}
                      className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100"
                    >
                      <Eye className="w-3 h-3" /> Ver Remisión
                    </button>
                  )}
                  <span>Atendió: {v.usuario_nombre || 'Bodega'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL REGISTRAR VENTA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Venta de Fruta</h3>
                  <p className="text-[11px] text-slate-500">Salida y facturación a cliente</p>
                </div>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente Comprador
                </label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto (Berry) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Berry Vendida
                </label>
                <select
                  required
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre} {prod.variedad ? `(${prod.variedad})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidad de Medida (kg, caja, charola, cubeta, tonelada) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidad de Venta
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['kg', 'caja', 'charola', 'cubeta', 'tonelada'] as UnidadMedida[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnidadMedida(u)}
                      className={`py-1.5 text-xs font-bold rounded-lg border capitalize transition ${
                        unidadMedida === u
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad y Precio de Venta Editable */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cantidad ({unidadMedida})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.1"
                    placeholder="ej. 600"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Venta / {unidadMedida} ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="ej. 75.00"
                    value={precioUnitario}
                    onChange={(e) => setPrecioUnitario(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculado en Tiempo Real */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-800">Total a Cobrar al Cliente:</span>
                <span className="text-base font-black text-emerald-900">
                  ${totalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              {/* Vinculación con Empaque del Cliente */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-blue-600" />
                    ¿Descontar Cajas del Cliente?
                  </label>
                  <input
                    type="checkbox"
                    checked={descontarEmpaque}
                    onChange={(e) => setDescontarEmpaque(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>

                {descontarEmpaque && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Tipo de Empaque
                      </label>
                      <select
                        value={empaqueTipoId}
                        onChange={(e) => setEmpaqueTipoId(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Selecciona empaque...</option>
                        {empaques.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Cajas a Descontar
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="ej. 300"
                        value={cajasDescontadas}
                        onChange={(e) => setCajasDescontadas(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Estado de Venta */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado del Pedido / Cobro
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoVenta)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="entregado">Entregado</option>
                  <option value="pendiente_pago">Pendiente de Pago</option>
                  <option value="pagada">Pagada / Liquidada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Subir Foto de Remisión / Factura */}
              <FileUpload
                label="Foto de Remisión / Factura Firmada"
                onFileSelected={(url) => setComprobanteUrl(url)}
                initialValue={comprobanteUrl}
              />

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
                <input
                  type="text"
                  placeholder="ej. Entregado en andén 2, transporte en frío"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Guardando Venta...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Registrar Venta en Sistema
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Foto */}
      {fotoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white rounded-2xl p-3">
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-2 right-2 p-1 bg-slate-900/60 text-white rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoModal} alt="Remisión" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </main>
  );
}
