'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  TrendingDown,
  Trash2,
  Calendar,
  CreditCard,
  Tag
} from 'lucide-react';

export default function GastosPage() {
  const { usuarioActual, isAdmin } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<GastoCategoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal para registrar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Fletes y Transporte');
  const [concepto, setConcepto] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  // Modal foto
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  const cargarDatos = async () => {
    if (!isAdmin) {
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      // 1. Cargar Gastos (usar select simple para máxima compatibilidad)
      const { data: gData, error: gError } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false });

      if (gError) {
        console.error('Error al consultar gastos:', gError);
      }

      if (gData) {
        setGastos(
          gData.map((g) => ({
            ...g,
            categoria: g.categoria || 'Gasto General',
            categoria_nombre: g.categoria || 'Gasto General',
          }))
        );
      }

      // 2. Cargar Categorías
      const { data: catData } = await supabase
        .from('gastos_categorias')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (catData && catData.length > 0) {
        setCategorias(catData);
        if (!categoriaSeleccionada) setCategoriaSeleccionada(catData[0].nombre);
      } else {
        // Fallback si no hay categorías
        setCategorias([
          { id: 1, nombre: 'Fletes y Transporte', icono: 'Truck', activo: true },
          { id: 2, nombre: 'Mano de Obra / Cuadrillas', icono: 'Users', activo: true },
          { id: 3, nombre: 'Insumos de Empaque y Cintas', icono: 'Package', activo: true },
          { id: 4, nombre: 'Hielo y Cuarto Frío', icono: 'Snowflake', activo: true },
          { id: 5, nombre: 'Mantenimiento y Reparaciones', icono: 'Wrench', activo: true },
          { id: 6, nombre: 'Servicios y Renta de Bodega', icono: 'Building', activo: true },
          { id: 7, nombre: 'Otros Gastos Generales', icono: 'DollarSign', activo: true },
        ]);
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
    if (!categoriaSeleccionada || !concepto.trim() || !monto || Number(monto) <= 0) {
      alert('Por favor completa el concepto y un monto válido.');
      return;
    }

    setGuardando(true);
    try {
      const catObj = categorias.find((c) => c.nombre === categoriaSeleccionada);
      const { error } = await supabase.from('gastos').insert([
        {
          categoria: categoriaSeleccionada,
          categoria_id: catObj ? catObj.id : null,
          concepto: concepto.trim(),
          monto: parseFloat(monto),
          metodo_pago: metodoPago,
          comprobante_url: comprobanteUrl,
          comprobante_ref: comprobanteUrl ? 'ADJUNTO' : null,
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

  const handleEliminarGasto = async (id: number, conceptoGasto: string) => {
    if (!confirm(`¿Estás seguro de eliminar el gasto "${conceptoGasto}"?`)) return;

    try {
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (error) throw error;
      await cargarDatos();
    } catch (err: unknown) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  const gastosFiltrados = gastos.filter((g) => {
    const matchCat = filtroCategoria === 'todos' || g.categoria === filtroCategoria;
    const matchTexto = `${g.concepto} ${g.categoria} ${g.metodo_pago} ${g.comprobante_ref || ''} ${g.notas || ''}`.toLowerCase();
    return matchCat && matchTexto.includes(busqueda.toLowerCase());
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
          <p className="text-xs text-slate-500">Desglose de fletes, nómina, insumos y bodega</p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-200 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </button>
      </div>

      {/* Tarjeta de Total */}
      <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider block">
            Total Gastos Operativos ({gastos.length} registrados)
          </span>
          <p className="text-2xl font-black mt-1">
            ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
          <TrendingDown className="w-6 h-6 text-rose-300" />
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por concepto o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <button
            onClick={cargarDatos}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Píldoras de categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setFiltroCategoria('todos')}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
              filtroCategoria === 'todos'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({gastos.length})
          </button>
          {Array.from(new Set(gastos.map((g) => g.categoria).filter(Boolean))).map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat as string)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
                filtroCategoria === cat
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE GASTOS DETALLADO */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Detalle de Gastos
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            {gastosFiltrados.length} encontrados
          </span>
        </div>

        {cargando && gastos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            <p className="text-xs">Cargando desglose de gastos...</p>
          </div>
        ) : gastosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No se encontraron gastos que coincidan con la búsqueda.
          </div>
        ) : (
          gastosFiltrados.map((g) => (
            <div
              key={g.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      {g.categoria}
                    </span>
                    {g.comprobante_ref && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Ref: {g.comprobante_ref}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{g.concepto}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" /> {g.metodo_pago || 'Efectivo'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(g.fecha).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {g.notas && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">"{g.notas}"</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-rose-600 block">
                    -${Number(g.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400">MXN</span>
                </div>
              </div>

              {/* Barra de Acciones del Gasto */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {g.comprobante_url ? (
                  <button
                    onClick={() => setFotoModal(g.comprobante_url || null)}
                    className="text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg hover:bg-rose-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Ticket / Foto
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Sin ticket adjunto</span>
                )}

                <button
                  onClick={() => handleEliminarGasto(g.id, g.concepto)}
                  className="text-slate-400 hover:text-red-600 p-1 flex items-center gap-1 text-[11px] transition"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
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
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                  <option value="Fletes y Transporte">Fletes y Transporte</option>
                  <option value="Mano de Obra / Cuadrillas">Mano de Obra / Cuadrillas</option>
                  <option value="Insumos de Empaque y Cintas">Insumos de Empaque y Cintas</option>
                  <option value="Hielo y Cuarto Frío">Hielo y Cuarto Frío</option>
                  <option value="Combustible y Gasolina">Combustible y Gasolina</option>
                  <option value="Servicios y Renta">Servicios y Renta</option>
                  <option value="Otros Gastos Generales">Otros Gastos Generales</option>
                </select>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto / Descripción del Gasto
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
                  placeholder="ej. Factura #4410 entregada a contabilidad"
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
