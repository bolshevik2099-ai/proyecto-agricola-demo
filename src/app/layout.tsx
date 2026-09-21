import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroTech Demo - Gestión y Monitoreo Agrícola",
  description: "Plataforma inteligente de monitoreo agrícola impulsada por Next.js y Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
