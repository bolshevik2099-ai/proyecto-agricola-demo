import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Tamfresh - Comercializadora de Berries | Zamora, Mich.",
  description: "Sistema de gestión de compras, ventas, gastos y control de inventario de empaque por cliente para Tamfresh",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#064e3b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900 font-sans pb-20 selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto min-h-[calc(100vh-3.5rem)]">
            {children}
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
