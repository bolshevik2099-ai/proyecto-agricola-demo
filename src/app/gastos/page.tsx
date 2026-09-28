'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Gasto, GastoCategoria } from '@/lib/types';
import { FileUpload } from '@/components/FileUpload';
import { 
  Receipt, 
  Plus, 
  RefreshCw, 
  Search, 
  DollarSign, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Eye,
  TrendingDown
} from 'lucide-react';

export default function GastosPage() {
  const { usuarioActual, isAdmin } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<GastoCategoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal para registrar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  // Modal foto
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  const cargarDatos = async () => {
    if (!isAdmin) {
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      // 1. Gastos
      const { data: gData } = await supabase
        .from('gastos')
        .select('*, gastos_categorias(nombre), usuarios(nombre)')
        .order('fecha', { ascending: false })
        .limit(50);

      if (gData) {
        setGastos(
          gData.map((g) => ({
            ...g,
            categoria_nombre: g.gastos_categorias?.nombre,
            usuario_nombre: g.usuarios?.nombre,
          }))
        );
      }

      // 2. Categorías
      const { data: catData } = await supabase
        .from('gastos_categorias')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (catData) {
        setCategorias(catData);
        if (catData.length > 0 && !categoriaId) setCategoriaId(catData[0].id.toString());
      }
    } catch (err) {
      console.error('Error al cargar gastos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [isAdmin]);

  // Si es supervisor, restringir vista de gastos
  if (!isAdmin) {
    return (
      <main className="p-6 text-center space-y-4 max-w-sm mx-auto my-12">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-black text-slate-900">Acceso Exclusivo de Administrador</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          El módulo de gastos operativos e información financiera de la empresa solo está disponible para cuentas de Administrador (Abram / Juan).
        </p>
        <div className="pt-2">
          <p className="text-[11px] text-slate-400">
            Cambia de perfil en la barra superior con tu PIN de administrador para consultar este módulo.
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaId || !concepto.trim() || !monto || Number(monto) <= 0) {
      alert('Por favor completa todos los campos del gasto.');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase.from('gastos').insert([
        {
          categoria_id: parseInt(categoriaId),
          concepto: concepto.trim(),
          monto: parseFloat(monto),
          metodo_pago: metodoPago,
          comprobante_url: comprobanteUrl,
          usuario_id: usuarioActual?.id || null,
          notas: notas.trim(),
        },
      ]);

      if (error) throw error;

      setConcepto('');
      setMonto('');
      setNotas('');
      setComprobanteUrl('');
      setModalAbierto(false);
      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar gasto';
      alert('Error: ' + msg);
    } finally {
      setGuardando(false);
    }
  };

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  const gastosFiltrados = gastos.filter((g) => {
    const texto = `${g.concepto} ${g.categoria_nombre} ${g.metodo_pago} ${g.notas}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <main className="p-4 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-600" />
            Gastos Operativos
          </h1>
          <p className="text-xs text-slate-500">Combustible, fletes, mano de obra, insumos y bodega</p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-200 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* Resumen Total */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Gastos Registrados
          </span>
          <p className="text-xl font-black text-rose-600 mt-0.5">
            ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar concepto o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
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

      {/* LISTADO DE GASTOS */}
      <div className="space-y-2.5">
        {cargando && gastos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            <p className="text-xs">Cargando gastos de la empresa...</p>
          </div>
        ) : gastosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No hay gastos registrados que coincidan.
          </div>
        ) : (
          gastosFiltrados.map((g) => (
            <div
              key={g.id}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {g.categoria_nombre}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 mt-1">{g.concepto}</h3>
                  <p className="text-[11px] text-slate-500">
                    Método: {g.metodo_pago} {g.notas ? `· "${g.notas}"` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-rose-600 block">
                    -${Number(g.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(g.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              {g.comprobante_url && (
                <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setFotoModal(g.comprobante_url || null)}
                    className="text-xs text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md hover:bg-rose-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Ticket / Factura
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL REGISTRAR GASTO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Gasto Operativo</h3>
                  <p className="text-[11px] text-slate-500">Salida de efectivo o transferencia</p>
                </div>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría del Gasto
                </label>
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto / Descripción
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Diésel para flete a Guadalajara"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Monto y Método */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto ($ MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.1"
                    placeholder="ej. 1500.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Subir Ticket / Factura */}
              <FileUpload
                label="Foto de Ticket o Comprobante"
                onFileSelected={(url) => setComprobanteUrl(url)}
                initialValue={comprobanteUrl}
              />

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
                <input
                  type="text"
                  placeholder="ej. Pagado a chofer Luis"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Registrar Gasto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Foto */}
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
            <img src={fotoModal} alt="Ticket" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </main>
  );
}
