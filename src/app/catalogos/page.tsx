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
  Edit2,
  Trash2,
  MapPin,
  Phone,
  User
} from 'lucide-react';

type TabTipo = 'productos' | 'empaques' | 'clientes' | 'proveedores';

export default function CatalogosPage() {
  const { isAdmin } = useAuth();
  const [tabActiva, setTabActiva] = useState<TabTipo>('productos');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

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

  // Estados de edición (null = creando nuevo, obj = editando)
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [empaqueAEditar, setEmpaqueAEditar] = useState<EmpaqueTipo | null>(null);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);

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

  // Form Proveedor / Huerta
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

  // ==========================================
  // MANEJADORES PRODUCTO (BERRY)
  // ==========================================
  const abrirCrearProducto = () => {
    setProductoAEditar(null);
    setPNombre('');
    setPVariedad('');
    setPUnidad('kg');
    setPDesc('');
    setModalProducto(true);
  };

  const abrirEditarProducto = (p: Producto) => {
    setProductoAEditar(p);
    setPNombre(p.nombre);
    setPVariedad(p.variedad || '');
    setPUnidad(p.unidad_base || 'kg');
    setPDesc(p.descripcion || '');
    setModalProducto(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNombre.trim()) return;
    setGuardando(true);
    try {
      if (productoAEditar) {
        // Actualizar
        const { error } = await supabase
          .from('productos')
          .update({
            nombre: pNombre.trim(),
            variedad: pVariedad.trim(),
            unidad_base: pUnidad,
            descripcion: pDesc.trim(),
          })
          .eq('id', productoAEditar.id);
        if (error) throw error;
      } else {
        // Insertar
        const { error } = await supabase.from('productos').insert([
          {
            nombre: pNombre.trim(),
            variedad: pVariedad.trim(),
            unidad_base: pUnidad,
            descripcion: pDesc.trim(),
          },
        ]);
        if (error) throw error;
      }

      setModalProducto(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProducto = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) return;
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          alert('No se puede eliminar porque ya tiene compras o ventas registradas. Puedes cambiar su nombre o editarlo.');
        } else {
          throw error;
        }
      } else {
        await cargarCatalogos();
      }
    } catch (err: unknown) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // ==========================================
  // MANEJADORES EMPAQUE
  // ==========================================
  const abrirCrearEmpaque = () => {
    setEmpaqueAEditar(null);
    setENombre('');
    setEGramaje('');
    setEMaterial('Plástico PET');
    setECapacidad('');
    setModalEmpaque(true);
  };

  const abrirEditarEmpaque = (emp: EmpaqueTipo) => {
    setEmpaqueAEditar(emp);
    setENombre(emp.nombre);
    setEGramaje(emp.gramaje_g ? emp.gramaje_g.toString() : '');
    setEMaterial(emp.material || 'Plástico PET');
    setECapacidad(emp.capacidad_desc || '');
    setModalEmpaque(true);
  };

  const handleGuardarEmpaque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eNombre.trim()) return;
    setGuardando(true);
    try {
      if (empaqueAEditar) {
        const { error } = await supabase
          .from('empaque_tipos')
          .update({
            nombre: eNombre.trim(),
            gramaje_g: eGramaje ? parseFloat(eGramaje) : 0,
            material: eMaterial,
            capacidad_desc: eCapacidad.trim(),
          })
          .eq('id', empaqueAEditar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('empaque_tipos').insert([
          {
            nombre: eNombre.trim(),
            gramaje_g: eGramaje ? parseFloat(eGramaje) : 0,
            material: eMaterial,
            capacidad_desc: eCapacidad.trim(),
          },
        ]);
        if (error) throw error;
      }

      setModalEmpaque(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarEmpaque = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el empaque "${nombre}"?`)) return;
    try {
      const { error } = await supabase.from('empaque_tipos').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          alert('No se puede eliminar porque tiene movimientos o ventas asociadas. Puedes editar sus datos.');
        } else {
          throw error;
        }
      } else {
        await cargarCatalogos();
      }
    } catch (err: unknown) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // ==========================================
  // MANEJADORES CLIENTE
  // ==========================================
  const abrirCrearCliente = () => {
    setClienteAEditar(null);
    setCNombre('');
    setCContacto('');
    setCTelefono('');
    setCCiudad('Zamora');
    setModalCliente(true);
  };

  const abrirEditarCliente = (c: Cliente) => {
    setClienteAEditar(c);
    setCNombre(c.nombre);
    setCContacto(c.contacto || '');
    setCTelefono(c.telefono || '');
    setCCiudad(c.ciudad || 'Zamora');
    setModalCliente(true);
  };

  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNombre.trim()) return;
    setGuardando(true);
    try {
      if (clienteAEditar) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: cNombre.trim(),
            contacto: cContacto.trim(),
            telefono: cTelefono.trim(),
            ciudad: cCiudad.trim(),
          })
          .eq('id', clienteAEditar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert([
          {
            nombre: cNombre.trim(),
            contacto: cContacto.trim(),
            telefono: cTelefono.trim(),
            ciudad: cCiudad.trim(),
          },
        ]);
        if (error) throw error;
      }

      setModalCliente(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarCliente = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el cliente "${nombre}"?`)) return;
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          alert('No se puede eliminar porque ya tiene ventas o cajas asociadas en la base de datos.');
        } else {
          throw error;
        }
      } else {
        await cargarCatalogos();
      }
    } catch (err: unknown) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // ==========================================
  // MANEJADORES PROVEEDOR / HUERTA
  // ==========================================
  const abrirCrearProveedor = () => {
    setProveedorAEditar(null);
    setPrNombre('');
    setPrContacto('');
    setPrTelefono('');
    setPrHuerta('Zamora');
    setPrBerry('Arándano');
    setModalProveedor(true);
  };

  const abrirEditarProveedor = (pr: Proveedor) => {
    setProveedorAEditar(pr);
    setPrNombre(pr.nombre);
    setPrContacto(pr.contacto || '');
    setPrTelefono(pr.telefono || '');
    setPrHuerta(pr.ubicacion_huerta || 'Zamora');
    setPrBerry(pr.tipo_berry_principal || 'Arándano');
    setModalProveedor(true);
  };

  const handleGuardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prNombre.trim()) return;
    setGuardando(true);
    try {
      if (proveedorAEditar) {
        const { error } = await supabase
          .from('proveedores')
          .update({
            nombre: prNombre.trim(),
            contacto: prContacto.trim(),
            telefono: prTelefono.trim(),
            ubicacion_huerta: prHuerta.trim(),
            tipo_berry_principal: prBerry,
          })
          .eq('id', proveedorAEditar.id);
        if (error) throw error;
      } else {
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
      }

      setModalProveedor(false);
      await cargarCatalogos();
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProveedor = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el productor / huerta "${nombre}"?`)) return;
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          alert('No se puede eliminar porque ya tiene compras de fruta registradas.');
        } else {
          throw error;
        }
      } else {
        await cargarCatalogos();
      }
    } catch (err: unknown) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // Filtrado de búsquedas
  const productosFiltrados = productos.filter((p) =>
    `${p.nombre} ${p.variedad || ''} ${p.descripcion || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const empaquesFiltrados = empaques.filter((e) =>
    `${e.nombre} ${e.material || ''} ${e.capacidad_desc || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre} ${c.contacto || ''} ${c.ciudad || ''} ${c.telefono || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const proveedoresFiltrados = proveedores.filter((pr) =>
    `${pr.nombre} ${pr.contacto || ''} ${pr.ubicacion_huerta || ''} ${pr.tipo_berry_principal || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

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
            Registra, edita y administra berries, empaques, clientes y huertas
          </p>
        </div>

        <button
          onClick={cargarCatalogos}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"
          title="Refrescar"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => {
            setTabActiva('productos');
            setBusqueda('');
          }}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'productos' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Berries ({productos.length})</span>
        </button>

        <button
          onClick={() => {
            setTabActiva('empaques');
            setBusqueda('');
          }}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'empaques' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Empaque ({empaques.length})</span>
        </button>

        <button
          onClick={() => {
            setTabActiva('clientes');
            setBusqueda('');
          }}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'clientes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clientes ({clientes.length})</span>
        </button>

        <button
          onClick={() => {
            setTabActiva('proveedores');
            setBusqueda('');
          }}
          className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
            tabActiva === 'proveedores' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Huertas ({proveedores.length})</span>
        </button>
      </div>

      {/* Barra de Búsqueda Rápida */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder={`Buscar en ${tabActiva}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        />
      </div>

      {/* TAB 1: PRODUCTOS / BERRIES */}
      {tabActiva === 'productos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tipos de Berries Registrados
            </h2>
            <button
              onClick={abrirCrearProducto}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Berry
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {productosFiltrados.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2.5 hover:border-purple-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{p.nombre}</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                      {p.unidad_base}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Variedad: <b className="text-slate-700">{p.variedad || 'Estándar'}</b>
                  </p>
                  {p.descripcion && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">{p.descripcion}</p>
                  )}
                </div>

                {/* Acciones Editar y Borrar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => abrirEditarProducto(p)}
                    className="text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>

                  <button
                    onClick={() => handleEliminarProducto(p.id, p.nombre)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                    title="Eliminar berry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
              onClick={abrirCrearEmpaque}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Empaque
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {empaquesFiltrados.map((e) => (
              <div
                key={e.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2.5 hover:border-blue-300 transition"
              >
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">{e.nombre}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Material: <b className="text-slate-700">{e.material}</b> · {e.gramaje_g ? `${e.gramaje_g} gramos` : 'Cosecha/Granel'}
                  </p>
                  {e.capacidad_desc && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">{e.capacidad_desc}</p>
                  )}
                </div>

                {/* Acciones Editar y Borrar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => abrirEditarEmpaque(e)}
                    className="text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>

                  <button
                    onClick={() => handleEliminarEmpaque(e.id, e.nombre)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                    title="Eliminar empaque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
              onClick={abrirCrearCliente}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {clientesFiltrados.map((c) => (
              <div
                key={c.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2.5 hover:border-emerald-300 transition"
              >
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">{c.nombre}</span>
                  <div className="space-y-0.5 mt-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {c.ciudad || 'Zamora'}
                    </p>
                    {c.contacto && (
                      <p className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" /> {c.contacto}
                      </p>
                    )}
                    {c.telefono && (
                      <p className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Phone className="w-3 h-3 text-emerald-600 shrink-0" /> {c.telefono}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones Editar y Borrar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => abrirEditarCliente(c)}
                    className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>

                  <button
                    onClick={() => handleEliminarCliente(c.id, c.nombre)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
              onClick={abrirCrearProveedor}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Huerta
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {proveedoresFiltrados.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2.5 hover:border-amber-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-extrabold text-sm text-slate-900">{p.nombre}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      {p.tipo_berry_principal}
                    </span>
                  </div>

                  <div className="space-y-0.5 mt-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {p.ubicacion_huerta}
                    </p>
                    {p.contacto && (
                      <p className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" /> {p.contacto}
                      </p>
                    )}
                    {p.telefono && (
                      <p className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {p.telefono}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones Editar y Borrar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => abrirEditarProveedor(p)}
                    className="text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>

                  <button
                    onClick={() => handleEliminarProveedor(p.id, p.nombre)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                    title="Eliminar huerta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALES CREAR / EDITAR */}
      {/* ========================================================= */}

      {/* MODAL PRODUCTO / BERRY */}
      {modalProducto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {productoAEditar ? 'Editar Tipo de Berry' : 'Registrar Tipo de Berry / Producto'}
              </h3>
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

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalProducto(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {guardando ? 'Guardando...' : productoAEditar ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EMPAQUE */}
      {modalEmpaque && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {empaqueAEditar ? 'Editar Tipo de Empaque' : 'Registrar Tipo de Caja / Empaque'}
              </h3>
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

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalEmpaque(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {guardando ? 'Guardando...' : empaqueAEditar ? 'Guardar Cambios' : 'Crear Tipo de Empaque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {clienteAEditar ? 'Editar Cliente Comercial' : 'Registrar Cliente Comercial'}
              </h3>
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

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalCliente(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {guardando ? 'Guardando...' : clienteAEditar ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROVEEDOR / HUERTA */}
      {modalProveedor && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {proveedorAEditar ? 'Editar Huerta / Productor' : 'Registrar Huerta / Productor'}
              </h3>
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

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalProveedor(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-2/3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {guardando ? 'Guardando...' : proveedorAEditar ? 'Guardar Cambios' : 'Crear Productor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
