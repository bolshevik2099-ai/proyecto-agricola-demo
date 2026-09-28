'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Receipt, 
  Sliders
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // Opciones de navegación adaptadas al rol
  const items = isAdmin
    ? [
        { href: '/', label: 'Inicio', icon: Home },
        { href: '/empaque', label: 'Empaque', icon: Package },
        { href: '/compras', label: 'Compras', icon: ShoppingCart },
        { href: '/ventas', label: 'Ventas', icon: TrendingUp },
        { href: '/gastos', label: 'Gastos', icon: Receipt },
        { href: '/catalogos', label: 'Catálogos', icon: Sliders },
      ]
    : [
        { href: '/', label: 'Inicio', icon: Home },
        { href: '/empaque', label: 'Empaque', icon: Package },
        { href: '/compras', label: '+Compra', icon: ShoppingCart },
        { href: '/ventas', label: '+Venta', icon: TrendingUp },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const activo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                activo
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  activo ? 'bg-emerald-100 text-emerald-800 scale-105' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {activo && (
                <span className="absolute -top-1 w-6 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
