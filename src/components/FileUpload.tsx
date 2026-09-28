'use client';

import React, { useState } from 'react';
import { Camera, Upload, X, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelected: (base64Url: string) => void;
  initialValue?: string;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  onFileSelected,
  initialValue = '',
  required = false,
}) => {
  const [preview, setPreview] = useState<string>(initialValue);
  const [cargando, setCargando] = useState(false);

  const procesarArchivo = (file: File) => {
    setCargando(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onFileSelected(base64String);
      setCargando(false);
    };

    reader.onerror = () => {
      alert('Error al leer el archivo seleccionado');
      setCargando(false);
    };

    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivo(e.target.files[0]);
    }
  };

  const limpiar = () => {
    setPreview('');
    onFileSelected('');
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {preview ? (
        <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Comprobante"
              className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-sm shrink-0"
            />
            <div className="truncate">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Comprobante adjunto
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Listo para guardar con el registro</p>
            </div>
          </div>
          <button
            type="button"
            onClick={limpiar}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Quitar comprobante"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Opción Cámara Móvil */}
          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition text-center active:scale-95">
            <Camera className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-xs font-medium text-slate-700">Tomar Foto</span>
            <span className="text-[10px] text-slate-400">Báscula / Remisión</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleChange}
              className="hidden"
            />
          </label>

          {/* Opción Subir Archivo/Galería */}
          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition text-center active:scale-95">
            <Upload className="w-5 h-5 text-indigo-600 mb-1" />
            <span className="text-xs font-medium text-slate-700">Subir Archivo</span>
            <span className="text-[10px] text-slate-400">PDF o Imagen</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};
