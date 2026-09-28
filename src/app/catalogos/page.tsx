'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Producto, EmpaqueTipo, Cliente, Proveedor } from '@/lib/types';
import { 
  Sliders, 
  Plus, 
  RefreshCw, 
  Sprout, 
  Package, 
  Users, 
  Building2, 
  CheckCircle2, 
  X,
  Search,
  Edit2
} from 'lucide-react';

type TabTipo = 'productos' | 'empaques' | 'clientes' | 'proveedores';

export default function CatalogosPage() {
  const { isAdmin } = useAuth();
  const [tabActiva, setTabActiva] = useState<TabTipo>('productos');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [empaques, setEmpaques] = useState<EmpaqueTipo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Modales
  const [modalProducto, setModalProducto] = useState(false);
  const [modalEmpaque, setModalEmpaque] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalProveedor, setModalProveedor] = useState(false);

  // Form Producto
  const [pNombre, setPNombre] = useState('');
  const [pVariedad, setPVariedad] = useState('');
  const [pUnidad, setPUnidad] = useState('kg');
  const [pDesc, setPDesc] = useState('');

  // Form Empaque
  const [eNombre, setENombre] = useState('');
  const [eGramaje, setEGramaje] = useState('');
  const [eMaterial, setEMaterial] = useState('Plástico PET');
  const [eCapacidad, setECapacidad] = useState('');

  // Form Cliente
  const [cNombre, setCNombre] = useState('');
  const [cContacto, setCContacto] = useState('');
  const [cTelefono, setCTelefono] = useState('');
  const [cCiudad, setCCiudad] = useState('Zamora');

  // Form Proveedor
  const [prNombre, setPrNombre] = useState('');
  const [prContacto, setPrContacto] = useState('');
  const [prTelefono, setPrTelefono] = useState('');
  const [prHuerta, setPrHuerta] = useState('Zamora');
  const [prBerry, setPrBerry] = useState('Arándano');

  const cargarCatalogos = async () => {
    setCargando(true);
    try {
      const [prodRes, empRes, cliRes, provRes] = await Promise.all([
        supabase.from('productos').select('*').order('nombre', { ascending: true }),
        supabase.from('empaque_tipos').select('*').order('nombre', { ascending: true }),
        supabase.from('clientes').select('*').order('nombre', { ascending: true }),
        supabase.from('proveedores').select('*').order('nombre', { ascending: true }),
      ]);

      if (prodRes.data) setProductos(prodRes.data);
      if (empRes.data) setEmpaques(empRes.data);
      if (cliRes.data) setClientes(cliRes.data);
      if (provRes.data) setProveedores(provRes.data);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Guardar Producto
  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNombre.trim()) return;
    setGuardando(true);
    try {
      const { error } = await supabase.from('productos').insert([
        {
          nombre: pNombre.trim(),
          variedad: pVariedad.trim(),
          unidad_base: pUnidad,
          descripcion: pDesc.trim(),
        },
      ]);
      if (error) throw error;
      setPNombre('');
      setPVariedad('');
      setPDesc('');
      setModalProducto(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  // Guardar Empaque
  const handleGuardarEmpaque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eNombre.trim()) return;
    setGuardando(true);
    try {
      const { error } = await supabase.from('empaque_tipos').insert([
        {
          nombre: eNombre.trim(),
          gramaje_g: eGramaje ? parseFloat(eGramaje) : 0,
          material: eMaterial,
          capacidad_desc: eCapacidad.trim(),
        },
      ]);
      if (error) throw error;
      setENombre('');
      setEGramaje('');
      setECapacidad('');
      setModalEmpaque(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  // Guardar Cliente
  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNombre.trim()) return;
    setGuardando(true);
    try {
      const { error } = await supabase.from('clientes').insert([
        {
          nombre: cNombre.trim(),
          contacto: cContacto.trim(),
          telefono: cTelefono.trim(),
          ciudad: cCiudad.trim(),
        },
      ]);
      if (error) throw error;
      setCNombre('');
      setCContacto('');
      setCTelefono('');
      setModalCliente(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  // Guardar Proveedor
  const handleGuardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prNombre.trim()) return;
    setGuardando(true);
    try {
      const { error } = await supabase.from('proveedores').insert([
        {
          nombre: prNombre.trim(),
          contacto: prContacto.trim(),
          telefono: prTelefono.trim(),
          ubicacion_huerta: prHuerta.trim(),
          tipo_berry_principal: prBerry,
        },
      ]);
      if (error) throw error;
      setPrNombre('');
      setPrContacto('');
      setPrTelefono('');
      setModalProveedor(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="p-4 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600" />
            Catálogos y Configuración
          </h1>
          <p className="text-xs text-slate-500">
            Registra y administra tipos de berries, empaques, clientes y huertas
          </p>
        </div>

        <button
          onClick={cargarCatalogos}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setTabActiva('productos')}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'productos' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Berries ({productos.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('empaques')}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'empaques' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Empaque ({empaques.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('clientes')}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'clientes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clientes ({clientes.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('proveedores')}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'proveedores' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Huertas ({proveedores.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTOS / BERRIES */}
      {tabActiva === 'productos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tipos de Berries Registrados
            </h2>
            <button
              onClick={() => setModalProducto(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Producto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {productos.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{p.nombre}</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                      Unidad: {p.unidad_base}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Variedad: {p.variedad || 'Estándar'}
                  </p>
                  {p.descripcion && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">{p.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TIPOS DE EMPAQUE */}
      {tabActiva === 'empaques' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Catálogo de Cajas y Empaques
            </h2>
            <button
              onClick={() => setModalEmpaque(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Empaque
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {empaques.map((e) => (
              <div
                key={e.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
              >
                <div>
                  <span className="font-bold text-sm text-slate-900 block">{e.nombre}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Material: <b>{e.material}</b> · {e.gramaje_g ? `${e.gramaje_g} gramos` : 'Cosecha/Granel'}
                  </p>
                  {e.capacidad_desc && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{e.capacidad_desc}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLIENTES */}
      {tabActiva === 'clientes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clientes y Exportadoras
            </h2>
            <button
              onClick={() => setModalCliente(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {clientes.map((c) => (
              <div
                key={c.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm"
              >
                <span className="font-bold text-sm text-slate-900 block">{c.nombre}</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contacto: {c.contacto || 'Sin contacto'} · {c.ciudad}
                </p>
                {c.telefono && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">Tel: {c.telefono}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROVEEDORES / HUERTAS */}
      {tabActiva === 'proveedores' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Productores y Huertas Locales
            </h2>
            <button
              onClick={() => setModalProveedor(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Huerta
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {proveedores.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{p.nombre}</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {p.tipo_berry_principal}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Productor: {p.contacto || 'Don Miguel'} · Ubicación: {p.ubicacion_huerta}
                </p>
                {p.telefono && (
                  <p className="text-[11px] text-slate-600 font-semibold mt-1">Tel: {p.telefono}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRODUCTO */}
      {modalProducto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Tipo de Berry / Producto</h3>
              <button onClick={() => setModalProducto(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarProducto} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Berry (ej. Arándano, Fresa)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Arándano Orgánico"
                  value={pNombre}
                  onChange={(e) => setPNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Variedad (opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Biloxi, San Andreas, Clarita"
                  value={pVariedad}
                  onChange={(e) => setPVariedad(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidad Base
                </label>
                <select
                  value={pUnidad}
                  onChange={(e) => setPUnidad(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="caja">Caja</option>
                  <option value="charola">Charola</option>
                  <option value="tonelada">Tonelada</option>
                  <option value="cubeta">Cubeta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción / Notas
                </label>
                <input
                  type="text"
                  placeholder="ej. Fruta fresca premium de exportación"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                {guardando ? 'Guardando...' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO EMPAQUE */}
      {modalEmpaque && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Tipo de Caja / Empaque</h3>
              <button onClick={() => setModalEmpaque(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarEmpaque} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Empaque
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Clamshell 170g o Caja Máster 12x1"
                  value={eNombre}
                  onChange={(e) => setENombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gramaje (g)
                  </label>
                  <input
                    type="number"
                    placeholder="ej. 170"
                    value={eGramaje}
                    onChange={(e) => setEGramaje(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Material
                  </label>
                  <select
                    value={eMaterial}
                    onChange={(e) => setEMaterial(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Plástico PET">Plástico PET</option>
                    <option value="Cartón Corrugado">Cartón Corrugado</option>
                    <option value="Biodegradable">Biodegradable</option>
                    <option value="Plástico Rígido">Plástico Rígido</option>
                    <option value="Madera">Madera</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción / Capacidad
                </label>
                <input
                  type="text"
                  placeholder="ej. Empaque de 6 oz para zarzamora fresca"
                  value={eCapacidad}
                  onChange={(e) => setECapacidad(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                {guardando ? 'Guardando...' : 'Crear Tipo de Empaque'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Cliente Comercial</h3>
              <button onClick={() => setModalCliente(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarCliente} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Empresa o Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Frutas Finas de Michoacán"
                  value={cNombre}
                  onChange={(e) => setCNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Lic. Mariana"
                    value={cContacto}
                    onChange={(e) => setCContacto(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={cCiudad}
                    onChange={(e) => setCCiudad(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="ej. 351-555-1234"
                  value={cTelefono}
                  onChange={(e) => setCTelefono(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                {guardando ? 'Guardando...' : 'Crear Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA HUERTA / PROVEEDOR */}
      {modalProveedor && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Huerta / Productor</h3>
              <button onClick={() => setModalProveedor(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarProveedor} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Huerta o Productor
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Rancho Santa Rosa"
                  value={prNombre}
                  onChange={(e) => setPrNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Don Javier"
                    value={prContacto}
                    onChange={(e) => setPrContacto(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berry Principal
                  </label>
                  <input
                    type="text"
                    value={prBerry}
                    onChange={(e) => setPrBerry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ubicación de la Huerta
                </label>
                <input
                  type="text"
                  placeholder="ej. Tangancícuaro / Ario de Rayón"
                  value={prHuerta}
                  onChange={(e) => setPrHuerta(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="ej. 351-555-4321"
                  value={prTelefono}
                  onChange={(e) => setPrTelefono(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                {guardando ? 'Guardando...' : 'Crear Productor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
