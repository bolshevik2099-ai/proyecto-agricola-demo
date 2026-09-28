'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { SaldoEmpaque, Compra, Venta, Gasto } from '@/lib/types';
import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  Package, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Boxes, 
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { usuarioActual, isAdmin, isSupervisor } = useAuth();
  const [cargando, setCargando] = useState(true);

  // Estados de datos
  const [saldosEmpaque, setSaldosEmpaque] = useState<SaldoEmpaque[]>([]);
  const [ultimasCompras, setUltimasCompras] = useState<Compra[]>([]);
  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([]);
  const [gastosHoy, setGastosHoy] = useState<number>(0);
  const [comprasHoyTotal, setComprasHoyTotal] = useState<number>(0);
  const [ventasHoyTotal, setVentasHoyTotal] = useState<number>(0);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cargar saldos de empaque
      const { data: saldosData } = await supabase
        .from('vista_saldos_empaque')
        .select('*')
        .gt('saldo_disponible', 0)
        .order('saldo_disponible', { ascending: false })
        .limit(6);

      if (saldosData) setSaldosEmpaque(saldosData);

      // 2. Últimas compras
      const { data: comprasData } = await supabase
        .from('compras')
        .select('*, proveedores(nombre), productos(nombre)')
        .order('fecha', { ascending: false })
        .limit(5);

      if (comprasData) {
        setUltimasCompras(
          comprasData.map((c) => ({
            ...c,
            proveedor_nombre: c.proveedores?.nombre,
            producto_nombre: c.productos?.nombre,
          }))
        );
      }

      // 3. Últimas ventas
      const { data: ventasData } = await supabase
        .from('ventas')
        .select('*, clientes(nombre), productos(nombre)')
        .order('fecha', { ascending: false })
        .limit(5);

      if (ventasData) {
        setUltimasVentas(
          ventasData.map((v) => ({
            ...v,
            cliente_nombre: v.clientes?.nombre,
            producto_nombre: v.productos?.nombre,
          }))
        );
      }

      // 4. Totales del día / acumulados si es admin
      const { data: vTotal } = await supabase.from('ventas').select('total');
      if (vTotal) {
        const sumV = vTotal.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        setVentasHoyTotal(sumV);
      }

      const { data: cTotal } = await supabase.from('compras').select('total');
      if (cTotal) {
        const sumC = cTotal.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        setComprasHoyTotal(sumC);
      }

      const { data: gTotal } = await supabase.from('gastos').select('monto');
      if (gTotal) {
        const sumG = gTotal.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
        setGastosHoy(sumG);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const utilidadEstimada = ventasHoyTotal - comprasHoyTotal - gastosHoy;

  return (
    <main className="p-4 space-y-5">
      {/* Saludo y Encabezado de Sesión */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase bg-emerald-700/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              {isAdmin ? 'Panel Ejecutivo' : 'Operación Bodega'}
            </span>
            <button
              onClick={cargarDatos}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition active:scale-95"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            Hola, {usuarioActual?.nombre || 'Usuario'}
          </h1>
          <p className="text-xs text-emerald-200/90 mt-0.5">
            {isAdmin
              ? 'Control general de compras, ventas, gastos y balance de empaques.'
              : 'Control operativo de recepción de fruta y cajas de empaque en Zamora.'}
          </p>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
          <Boxes className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* BOTONES DE ACCIÓN RÁPIDA (Muy accesibles para móvil) */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
          Acciones Rápidas
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/compras"
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 hover:border-emerald-500 active:scale-98 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block leading-tight">
                + Comprar Fruta
              </span>
              <span className="text-[10px] text-slate-400">Recepción huerta</span>
            </div>
          </Link>

          <Link
            href="/ventas"
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 hover:border-emerald-500 active:scale-98 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block leading-tight">
                + Registrar Venta
              </span>
              <span className="text-[10px] text-slate-400">Salida a cliente</span>
            </div>
          </Link>

          <Link
            href="/empaque"
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 hover:border-emerald-500 active:scale-98 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block leading-tight">
                Control Empaque
              </span>
              <span className="text-[10px] text-slate-400">Cajas de clientes</span>
            </div>
          </Link>

          {isAdmin ? (
            <Link
              href="/gastos"
              className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 hover:border-emerald-500 active:scale-98 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block leading-tight">
                  + Registrar Gasto
                </span>
                <span className="text-[10px] text-slate-400">Fletes, nómina, etc.</span>
              </div>
            </Link>
          ) : (
            <Link
              href="/catalogos"
              className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 hover:border-emerald-500 active:scale-98 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block leading-tight">
                  Ver Catálogos
                </span>
                <span className="text-[10px] text-slate-400">Berries y empaques</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* MÉTRICAS FINANCIERAS (SOLO PARA ADMINS: ABRAM / JUAN) */}
      {isAdmin && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resumen Financiero Tamfresh
            </p>
            <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
              MXN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Ventas */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Total Ventas
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                ${ventasHoyTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Compras Fruta */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" /> Costo Compras
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                ${comprasHoyTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Gastos Operativos */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-rose-600" /> Gastos Operativos
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                ${gastosHoy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Utilidad Bruta Estimada */}
            <div className={`p-3.5 rounded-2xl border shadow-sm ${
              utilidadEstimada >= 0 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}>
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Balance Neto
              </span>
              <p className="text-lg font-black mt-1">
                ${utilidadEstimada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN CRÍTICA: INVENTARIO DE CAJAS DE EMPAQUE POR CLIENTE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Empaques de Clientes en Bodega
              </h2>
              <p className="text-[10px] text-slate-400">Material disponible para armar pedidos</p>
            </div>
          </div>
          <Link
            href="/empaque"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {saldosEmpaque.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No hay saldos registrados de empaques.
            <div className="mt-2">
              <Link
                href="/empaque"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-slate-300 px-3 py-1 rounded-lg shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Recepción de Cajas
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {saldosEmpaque.map((s, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{s.cliente_nombre}</p>
                  <p className="text-[11px] text-slate-500">
                    {s.empaque_nombre} ({s.material})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                    {s.saldo_disponible.toLocaleString()} cajas
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">En poder Tamfresh</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVIDAD RECIENTE (ÚLTIMAS COMPRAS / VENTAS) */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Últimos Movimientos
        </p>

        {/* Compras recientes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" /> Compras Recientes a Productores
            </span>
            <Link href="/compras" className="text-[11px] text-emerald-700 font-semibold">
              Ver más
            </Link>
          </div>

          {ultimasCompras.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No hay compras registradas aún.</p>
          ) : (
            <div className="space-y-2">
              {ultimasCompras.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-bold text-slate-900 block">{c.producto_nombre}</span>
                    <span className="text-[10px] text-slate-400">
                      {c.proveedor_nombre} · {c.cantidad} {c.unidad_medida}
                    </span>
                  </div>
                  <div className="text-right">
                    {isAdmin && (
                      <span className="font-bold text-slate-800 block">
                        ${Number(c.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                      {c.calidad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas recientes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Ventas Recientes a Clientes
            </span>
            <Link href="/ventas" className="text-[11px] text-emerald-700 font-semibold">
              Ver más
            </Link>
          </div>

          {ultimasVentas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No hay ventas registradas aún.</p>
          ) : (
            <div className="space-y-2">
              {ultimasVentas.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-bold text-slate-900 block">{v.producto_nombre}</span>
                    <span className="text-[10px] text-slate-400">
                      {v.cliente_nombre} · {v.cantidad} {v.unidad_medida}
                    </span>
                  </div>
                  <div className="text-right">
                    {isAdmin && (
                      <span className="font-bold text-slate-800 block">
                        ${Number(v.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium capitalize">
                      {v.estado.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
