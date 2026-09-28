'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Cliente, EmpaqueTipo, SaldoEmpaque, EmpaqueMovimiento, TipoMovimientoEmpaque } from '@/lib/types';
import { FileUpload } from '@/components/FileUpload';
import { 
  Package, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Boxes,
  FileText,
  X
} from 'lucide-react';

export default function EmpaquePage() {
  const { usuarioActual } = useAuth();
  const [saldos, setSaldos] = useState<SaldoEmpaque[]>([]);
  const [movimientos, setMovimientos] = useState<EmpaqueMovimiento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tiposEmpaque, setTiposEmpaque] = useState<EmpaqueTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modal para registrar movimiento
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimientoEmpaque>('entrada_cliente');
  const [clienteId, setClienteId] = useState<string>('');
  const [empaqueTipoId, setEmpaqueTipoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [notas, setNotas] = useState<string>('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Saldos calculados
      const { data: sData } = await supabase
        .from('vista_saldos_empaque')
        .select('*')
        .order('cliente_nombre', { ascending: true });
      if (sData) setSaldos(sData);

      // 2. Historial de movimientos
      const { data: mData } = await supabase
        .from('empaque_movimientos')
        .select('*, clientes(nombre), empaque_tipos(nombre, gramaje_g, material), usuarios(nombre)')
        .order('fecha', { ascending: false })
        .limit(30);

      if (mData) {
        setMovimientos(
          mData.map((m) => ({
            ...m,
            cliente_nombre: m.clientes?.nombre,
            empaque_nombre: m.empaque_tipos?.nombre,
            usuario_nombre: m.usuarios?.nombre,
          }))
        );
      }

      // 3. Catálogo Clientes
      const { data: cData } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (cData) {
        setClientes(cData);
        if (cData.length > 0 && !clienteId) setClienteId(cData[0].id.toString());
      }

      // 4. Catálogo Empaques
      const { data: eData } = await supabase
        .from('empaque_tipos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (eData) {
        setTiposEmpaque(eData);
        if (eData.length > 0 && !empaqueTipoId) setEmpaqueTipoId(eData[0].id.toString());
      }
    } catch (err) {
      console.error('Error al cargar datos de empaque:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmitMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !empaqueTipoId || !cantidad || Number(cantidad) <= 0) {
      alert('Por favor completa todos los campos requeridos con una cantidad válida.');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase.from('empaque_movimientos').insert([
        {
          cliente_id: parseInt(clienteId),
          empaque_tipo_id: parseInt(empaqueTipoId),
          tipo_movimiento: tipoMovimiento,
          cantidad: parseInt(cantidad),
          comprobante_url: comprobanteUrl,
          usuario_id: usuarioActual?.id || null,
          notas: notas.trim(),
        },
      ]);

      if (error) throw error;

      // Limpiar y recargar
      setCantidad('');
      setNotas('');
      setComprobanteUrl('');
      setModalAbierto(false);
      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar movimiento';
      alert('Error: ' + msg);
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado de saldos
  const saldosFiltrados = saldos.filter((s) => {
    const matchCliente = filtroCliente === 'todos' || s.cliente_id.toString() === filtroCliente;
    const matchBusqueda =
      s.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.empaque_nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCliente && matchBusqueda;
  });

  return (
    <main className="p-4 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Control de Empaque
          </h1>
          <p className="text-xs text-slate-500">
            Cajas que te entregan los clientes vs lo que les devuelves
          </p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-200 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Registrar Cajas
        </button>
      </div>

      {/* Selector de Cliente y Búsqueda */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar empaque o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Píldoras de filtro por cliente */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setFiltroCliente('todos')}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
              filtroCliente === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos los clientes
          </button>
          {clientes.map((c) => (
            <button
              key={c.id}
              onClick={() => setFiltroCliente(c.id.toString())}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
                filtroCliente === c.id.toString()
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* TARJETAS DE SALDOS POR CLIENTE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Saldos Actuales en Bodega
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            {saldosFiltrados.length} registros
          </span>
        </div>

        {cargando && saldos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Cargando inventario de cajas...</p>
          </div>
        ) : saldosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No se encontraron saldos de empaque con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saldosFiltrados.map((item, index) => {
              const saldo = Number(item.saldo_disponible);
              const colorSaldo =
                saldo > 500
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : saldo > 0
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200';

              return (
                <div
                  key={index}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.cliente_nombre}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border ${colorSaldo}`}
                      >
                        {saldo.toLocaleString()} disp.
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{item.empaque_nombre}</h3>
                    <p className="text-[11px] text-slate-500">
                      Material: {item.material} · {item.gramaje_g ? `${item.gramaje_g}g` : 'Granel/Cosecha'}
                    </p>
                  </div>

                  {/* Detalle Entradas vs Salidas */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>Recibidas: <b>{Number(item.total_recibido).toLocaleString()}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Devueltas: <b>{Number(item.total_entregado).toLocaleString()}</b></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORIAL RECIENTE DE MOVIMIENTOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-400" /> Historial de Entradas y Salidas
        </h3>

        {movimientos.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No hay movimientos registrados.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {movimientos.map((m) => {
              const esEntrada = m.tipo_movimiento === 'entrada_cliente';
              const esSalida = m.tipo_movimiento === 'salida_a_cliente';

              return (
                <div key={m.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        esEntrada
                          ? 'bg-emerald-100 text-emerald-700'
                          : esSalida
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {esEntrada ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : esSalida ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {esEntrada
                          ? `Cliente entregó: ${m.cliente_nombre}`
                          : esSalida
                          ? `Entregado a cliente: ${m.cliente_nombre}`
                          : `Ajuste de inventario`}
                      </p>
                      <p className="text-[11px] text-slate-500">{m.empaque_nombre}</p>
                      {m.notas && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">"{m.notas}"</p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(m.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })} · Registró {m.usuario_nombre || 'Sistema'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-sm block ${
                        esEntrada ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {esEntrada ? '+' : '-'}{m.cantidad.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">cajas</span>
                    {m.comprobante_url && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold mt-1">
                        <FileText className="w-3 h-3" /> Foto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR MOVIMIENTO (ENTRADA / SALIDA) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Movimiento de Cajas</h3>
                  <p className="text-[11px] text-slate-500">Control de material de clientes</p>
                </div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovimiento} className="space-y-3.5 mt-4">
              {/* Selector de Tipo de Movimiento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('entrada_cliente')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      tipoMovimiento === 'entrada_cliente'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" /> Cliente me DA cajas
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('salida_a_cliente')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      tipoMovimiento === 'salida_a_cliente'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Le DEVUELVO cajas
                  </button>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente Comercial
                </label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Empaque */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Caja / Empaque
                </label>
                <select
                  required
                  value={empaqueTipoId}
                  onChange={(e) => setEmpaqueTipoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {tiposEmpaque.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} · {t.material} {t.gramaje_g ? `(${t.gramaje_g}g)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Cajas / Piezas
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="ej. 1200"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Foto o Vale de Empaque */}
              <FileUpload
                label="Comprobante / Vale de Empaque (Opcional)"
                onFileSelected={(url) => setComprobanteUrl(url)}
                initialValue={comprobanteUrl}
              />

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="ej. Llegó en camioneta con chofer Pedro"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Guardar Registro de Cajas
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
