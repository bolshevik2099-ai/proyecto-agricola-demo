'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Compra, Proveedor, Producto, UnidadMedida } from '@/lib/types';
import { FileUpload } from '@/components/FileUpload';
import { 
  ShoppingCart, 
  Plus, 
  RefreshCw, 
  Search, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  X,
  Filter,
  Eye,
  TrendingDown
} from 'lucide-react';

export default function ComprasPage() {
  const { usuarioActual, isAdmin } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal para registrar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorId, setProveedorId] = useState<string>('');
  const [productoId, setProductoId] = useState<string>('');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>('kg');
  const [cantidad, setCantidad] = useState<string>('');
  const [precioUnitario, setPrecioUnitario] = useState<string>('');
  const [calidad, setCalidad] = useState<string>('Primera');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  // Modal para ver foto/comprobante
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Listado de compras
      const { data: cData } = await supabase
        .from('compras')
        .select('*, proveedores(nombre, ubicacion_huerta), productos(nombre, variedad), usuarios(nombre)')
        .order('fecha', { ascending: false })
        .limit(50);

      if (cData) {
        setCompras(
          cData.map((c) => ({
            ...c,
            proveedor_nombre: c.proveedores?.nombre,
            producto_nombre: c.productos?.nombre,
            usuario_nombre: c.usuarios?.nombre,
          }))
        );
      }

      // 2. Proveedores
      const { data: provData } = await supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (provData) {
        setProveedores(provData);
        if (provData.length > 0 && !proveedorId) setProveedorId(provData[0].id.toString());
      }

      // 3. Productos (Berries)
      const { data: prodData } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (prodData) {
        setProductos(prodData);
        if (prodData.length > 0 && !productoId) setProductoId(prodData[0].id.toString());
      }
    } catch (err) {
      console.error('Error al cargar compras:', err);
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
    if (!proveedorId || !productoId || !cantidad || Number(cantidad) <= 0 || !precioUnitario || Number(precioUnitario) < 0) {
      alert('Por favor verifica que la cantidad y el precio unitario sean válidos.');
      return;
    }

    setGuardando(true);
    try {
      const folioGen = `COM-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from('compras').insert([
        {
          folio: folioGen,
          proveedor_id: parseInt(proveedorId),
          producto_id: parseInt(productoId),
          unidad_medida: unidadMedida,
          cantidad: parseFloat(cantidad),
          precio_unitario: parseFloat(precioUnitario),
          total: totalCalculado,
          calidad,
          comprobante_url: comprobanteUrl,
          usuario_id: usuarioActual?.id || null,
          notas: notas.trim(),
        },
      ]);

      if (error) throw error;

      // Limpiar y recargar
      setCantidad('');
      setPrecioUnitario('');
      setNotas('');
      setComprobanteUrl('');
      setModalAbierto(false);
      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar compra';
      alert('Error: ' + msg);
    } finally {
      setGuardando(false);
    }
  };

  const comprasFiltradas = compras.filter((c) => {
    const texto = `${c.proveedor_nombre} ${c.producto_nombre} ${c.folio} ${c.notas}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const totalKilos = compras.reduce((acc, c) => acc + (c.unidad_medida === 'kg' ? Number(c.cantidad) : 0), 0);
  const totalInvertido = compras.reduce((acc, c) => acc + Number(c.total), 0);

  return (
    <main className="p-4 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-600" />
            Compras de Fruta
          </h1>
          <p className="text-xs text-slate-500">Recepción de berries de huertas y productores</p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-200 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Nueva Compra
        </button>
      </div>

      {/* Resumen Superior si es Admin */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">Fruta en Kilos</span>
            <span className="text-lg font-black text-slate-900">
              {totalKilos.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">Costo Total Fruta</span>
            <span className="text-lg font-black text-amber-600">
              ${totalInvertido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
            placeholder="Buscar por productor o berry..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
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

      {/* LISTADO DE COMPRAS */}
      <div className="space-y-2.5">
        {cargando && compras.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
            <p className="text-xs">Cargando compras de fruta...</p>
          </div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No hay compras registradas que coincidan.
          </div>
        ) : (
          comprasFiltradas.map((c) => (
            <div
              key={c.id}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">{c.producto_nombre}</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                      {c.calidad}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{c.proveedor_nombre}</p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block">
                    {c.cantidad} {c.unidad_medida}
                  </span>
                  {isAdmin && (
                    <span className="text-xs font-bold text-amber-700">
                      ${Number(c.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Detalles secundarios y comprobante */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>
                  {isAdmin && `@$${Number(c.precio_unitario).toFixed(2)}/${c.unidad_medida} · `}
                  {new Date(c.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </span>

                <div className="flex items-center gap-2">
                  {c.comprobante_url && (
                    <button
                      onClick={() => setFotoModal(c.comprobante_url || null)}
                      className="text-blue-600 font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100"
                    >
                      <Eye className="w-3 h-3" /> Ver Báscula
                    </button>
                  )}
                  <span>Recibió: {c.usuario_nombre || 'Bodega'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL REGISTRAR COMPRA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Compra de Fruta</h3>
                  <p className="text-[11px] text-slate-500">Recepción de productor en báscula</p>
                </div>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              {/* Proveedor / Huerta */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Productor / Huerta
                </label>
                <select
                  required
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.ubicacion_huerta})
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto (Berry) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Berry
                </label>
                <select
                  required
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre} {prod.variedad ? `(${prod.variedad})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidad de Medida (Flexibilidad: kg, caja, charola, cubeta, tonelada) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidad de Compra
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['kg', 'caja', 'charola', 'cubeta', 'tonelada'] as UnidadMedida[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnidadMedida(u)}
                      className={`py-1.5 text-xs font-bold rounded-lg border capitalize transition ${
                        unidadMedida === u
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad y Precio Unitario Editable */}
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
                    placeholder="ej. 850.5"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio por {unidadMedida} ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="ej. 45.00"
                    value={precioUnitario}
                    onChange={(e) => setPrecioUnitario(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculado en Tiempo Real */}
              <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-800">Total a Pagar Productor:</span>
                <span className="text-base font-black text-amber-900">
                  ${totalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              {/* Calidad de Fruta */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Calidad</label>
                <select
                  value={calidad}
                  onChange={(e) => setCalidad(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Calidad Extra / Exportación">Calidad Extra / Exportación</option>
                  <option value="Primera">Primera</option>
                  <option value="Segunda / Proceso">Segunda / Proceso</option>
                </select>
              </div>

              {/* Subir Foto de Boleta / Báscula */}
              <FileUpload
                label="Foto de Boleta de Báscula / Ticket"
                onFileSelected={(url) => setComprobanteUrl(url)}
                initialValue={comprobanteUrl}
              />

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
                <input
                  type="text"
                  placeholder="ej. Fruta fresca recién cortada, lote 4"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-amber-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Guardando Compra...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Registrar Compra en Sistema
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
            <img src={fotoModal} alt="Boleta báscula" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </main>
  );
}
