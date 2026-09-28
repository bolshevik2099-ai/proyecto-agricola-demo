'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Usuario, RolUsuario } from './types';
import { supabase } from './supabaseClient';

interface AuthContextType {
  usuarioActual: Usuario | null;
  isAdmin: boolean;
  isSupervisor: boolean;
  cambiarUsuario: (usuario: Usuario, pinIngresado?: string) => boolean;
  usuariosDisponibles: Usuario[];
  cargandoUsuarios: boolean;
  recargarUsuarios: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  usuarioActual: null,
  isAdmin: false,
  isSupervisor: false,
  cambiarUsuario: () => false,
  usuariosDisponibles: [],
  cargandoUsuarios: true,
  recargarUsuarios: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);

  const recargarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setUsuariosDisponibles(data);
        
        // Cargar usuario guardado o por defecto el primero (Abram)
        const guardadoId = localStorage.getItem('tamfresh_usuario_id');
        const encontrado = data.find((u) => u.id.toString() === guardadoId);
        if (encontrado) {
          setUsuarioActual(encontrado);
        } else {
          // Por defecto Abram (Admin)
          setUsuarioActual(data[0]);
          localStorage.setItem('tamfresh_usuario_id', data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      // Fallback local por seguridad
      const fallbackAbram: Usuario = {
        id: 1,
        nombre: 'Abram',
        rol: 'admin',
        pin: '1234',
        activo: true,
      };
      setUsuarioActual(fallbackAbram);
      setUsuariosDisponibles([
        fallbackAbram,
        { id: 2, nombre: 'Juan', rol: 'admin', pin: '1234', activo: true },
        { id: 3, nombre: 'Supervisor Bodega', rol: 'supervisor', pin: '1234', activo: true },
      ]);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  useEffect(() => {
    recargarUsuarios();
  }, []);

  const cambiarUsuario = (usuario: Usuario, pinIngresado?: string): boolean => {
    // Si tiene PIN configurado y se requiere
    if (usuario.pin && pinIngresado !== undefined && pinIngresado !== usuario.pin) {
      return false;
    }
    setUsuarioActual(usuario);
    localStorage.setItem('tamfresh_usuario_id', usuario.id.toString());
    return true;
  };

  const isAdmin = usuarioActual?.rol === 'admin';
  const isSupervisor = usuarioActual?.rol === 'supervisor';

  return (
    <AuthContext.Provider
      value={{
        usuarioActual,
        isAdmin,
        isSupervisor,
        cambiarUsuario,
        usuariosDisponibles,
        cargandoUsuarios,
        recargarUsuarios,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
