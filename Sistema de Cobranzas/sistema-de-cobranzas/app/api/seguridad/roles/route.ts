import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('obtener_roles');

    if (error) throw error;

    const roles = typeof data === 'string' ? JSON.parse(data) : (data || []);

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (err: any) {
    console.error("GET roles error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error al obtener roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, descripcion } = await req.json();

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nombre de rol requerido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('crear_rol', {
      p_nombre: nombre.trim(),
      p_descripcion: descripcion?.trim() || null
    });

    if (error) throw error;

    return NextResponse.json(
      { success: true, rol: data },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST rol error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error al crear rol" },
      { status: 500 }
    );
  }
}
