import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('demostracion')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, cultivo, humedad_suelo, temperatura, estado } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('demostracion')
      .insert([
        {
          nombre,
          descripcion: descripcion || 'Registro de monitoreo vía AgroTech Web',
          cultivo: cultivo || 'Maíz',
          humedad_suelo: humedad_suelo ? parseFloat(humedad_suelo) : 65.0,
          temperatura: temperatura ? parseFloat(temperatura) : 23.5,
          estado: estado || 'Activo',
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
