'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Sprout, 
  Droplets, 
  Thermometer, 
  Activity, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  Layers,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

interface Registro {
  id: number;
  created_at: string;
  nombre: string;
  descripcion: string;
  cultivo: string;
  humedad_suelo: number;
  temperatura: number;
  estado: string;
}

export default function Home() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulario nuevo registro
  const [nombre, setNombre] = useState('');
  const [cultivo, setCultivo] = useState('Aguacate Hass');
  const [humedad, setHumedad] = useState('68');
  const [temperatura, setTemperatura] = useState('22');
  const [estado, setEstado] = useState('Óptimo');

  const fetchRegistros = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('demostracion')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar registros';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  const handleCrearRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('demostracion').insert([
        {
          nombre,
          cultivo,
          humedad_suelo: parseFloat(humedad),
          temperatura: parseFloat(temperatura),
          estado,
          descripcion: `Monitoreo registrado desde la app demo`,
        },
      ]);

      if (error) throw error;

      setNombre('');
      await fetchRegistros();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar registro';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const promedioHumedad = registros.length
    ? (registros.reduce((acc, r) => acc + (Number(r.humedad_suelo) || 0), 0) / registros.length).toFixed(1)
    : '65.0';

  const promedioTemp = registros.length
    ? (registros.reduce((acc, r) => acc + (Number(r.temperatura) || 0), 0) / registros.length).toFixed(1)
    : '23.0';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-200">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">AgroTech</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold ml-2 px-2 py-0.5 rounded-full">
                Demo En Vivo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase PostgreSQL
            </div>
            <button
              onClick={fetchRegistros}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-2xl">
            <span className="text-emerald-300 font-semibold text-xs tracking-wider uppercase bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Plataforma de Agricultura Inteligente
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight leading-tight">
              Monitoreo y Telemetría de Cultivos en Tiempo Real
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Dashboard de demostración conectado a la base de datos distribuida en Supabase, diseñado para visualizar el estado hídrico, temperatura y parcelas agrícolas con sincronización inmediata.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <Sprout className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Humedad Media</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{promedioHumedad}%</p>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Nivel óptimo
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temperatura</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{promedioTemp} °C</p>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">Clima templado</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parcelas Activas</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{registros.length}</p>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Con telemetría
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base de Datos</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">Supabase PG</p>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Tabla 'demostracion'
              </span>
            </div>
          </div>
        </div>

        {/* Sección Principal: Formulario + Tabla */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario para Crear Nuevo Registro */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Agregar Registro Demo</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Inserta una nueva parcela o sensor en la base de datos Supabase en tiempo real.
            </p>

            <form onSubmit={handleCrearRegistro} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Parcela / Sensor</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Sector Este - Lote C"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cultivo</label>
                  <select
                    value={cultivo}
                    onChange={(e) => setCultivo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Aguacate Hass">Aguacate Hass</option>
                    <option value="Café Arábica">Café Arábica</option>
                    <option value="Tomate Saladette">Tomate Saladette</option>
                    <option value="Maíz Blanco">Maíz Blanco</option>
                    <option value="Berries / Frutillas">Berries / Frutillas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Óptimo">Óptimo</option>
                    <option value="Riego programado">Riego programado</option>
                    <option value="Atención requerida">Atención requerida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Humedad (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={humedad}
                    onChange={(e) => setHumedad(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Registrar en Supabase
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tabla de Registros en Supabase */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Registros en Tabla 'demostracion'</h2>
                <p className="text-xs text-slate-500">Datos obtenidos directamente desde la API de Supabase</p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {registros.length} parcelas
              </span>
            </div>

            {errorMsg && (
              <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Parcela</th>
                    <th className="px-5 py-3.5">Cultivo</th>
                    <th className="px-5 py-3.5">Humedad</th>
                    <th className="px-5 py-3.5">Temp.</th>
                    <th className="px-5 py-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && registros.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Cargando datos desde Supabase...
                      </td>
                    </tr>
                  ) : registros.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        No hay registros en la tabla aún. ¡Agrega el primero desde el panel lateral!
                      </td>
                    </tr>
                  ) : (
                    registros.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{item.nombre}</p>
                          <p className="text-xs text-slate-400">{item.descripcion}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{item.cultivo || 'General'}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-slate-900">{item.humedad_suelo}%</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-slate-900">{item.temperatura}°C</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                              item.estado === 'Óptimo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.estado === 'Riego programado'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
