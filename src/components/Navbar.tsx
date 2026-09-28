'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { 
  Sprout, 
  UserCircle2, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown, 
  Check, 
  KeyRound,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { usuarioActual, cambiarUsuario, usuariosDisponibles, isAdmin } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<number | null>(null);
  const [errorPin, setErrorPin] = useState('');

  const abrirModal = () => {
    setErrorPin('');
    setPinInput('');
    setUsuarioSeleccionadoId(usuarioActual?.id || null);
    setModalAbierto(true);
  };

  const handleSeleccionar = (uId: number) => {
    setUsuarioSeleccionadoId(uId);
    setErrorPin('');
  };

  const confirmarCambio = () => {
    if (!usuarioSeleccionadoId) return;
    const target = usuariosDisponibles.find((u) => u.id === usuarioSeleccionadoId);
    if (!target) return;

    // Si es admin y tiene PIN configurado (o si el usuario pide pin)
    if (target.pin && pinInput !== target.pin && target.id !== usuarioActual?.id) {
      setErrorPin('PIN incorrecto. (PIN por defecto: 1234)');
      return;
    }

    cambiarUsuario(target);
    setModalAbierto(false);
  };

  return (
    <>
      <header className="bg-emerald-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo Tamfresh */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-emerald-700/80 p-1.5 rounded-lg border border-emerald-500/40 text-emerald-200 group-hover:scale-105 transition">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">TAMFRESH</span>
                <span className="text-[10px] bg-emerald-600/80 text-emerald-100 font-bold px-1.5 py-0.2 rounded uppercase">
                  Zamora
                </span>
              </div>
              <p className="text-[9px] text-emerald-300/80 -mt-0.5 tracking-wider">Comercializadora de Berries</p>
            </div>
          </Link>

          {/* Selector de Perfil Rápido */}
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/50 px-2.5 py-1 rounded-full text-xs transition active:scale-95"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-200">
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left">
              <span className="font-semibold text-[11px] block leading-none">
                {usuarioActual?.nombre || 'Cargando...'}
              </span>
              <span className="text-[9px] text-emerald-300 capitalize leading-none">
                {usuarioActual?.rol === 'admin' ? 'Administrador' : 'Supervisor Bodega'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-emerald-300 ml-0.5" />
          </button>
        </div>
      </header>

      {/* Modal Cambio de Usuario Móvil */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Cambiar Usuario Activo</h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              Selecciona quién está usando la app en este dispositivo:
            </p>

            {/* Lista de perfiles */}
            <div className="space-y-2 mb-4">
              {usuariosDisponibles.map((u) => {
                const seleccionado = usuarioSeleccionadoId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSeleccionar(u.id)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      seleccionado
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          u.rol === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.rol === 'admin' ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.nombre}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          {u.rol === 'admin' ? 'Acceso Total (Admin)' : 'Supervisor de Bodega'}
                        </p>
                      </div>
                    </div>
                    {seleccionado && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {/* Input de PIN */}
            {usuarioSeleccionadoId && (
              <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  PIN de Seguridad (PIN por defecto: 1234)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-center tracking-widest font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {errorPin && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{errorPin}</p>
                )}
              </div>
            )}

            <button
              onClick={confirmarCambio}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Confirmar e Iniciar Sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
};
