import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nombres, apellidos } = body;

    // Validar campos obligatorios
    if (!email || !password || !nombres || !apellidos) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/protected`,
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return NextResponse.json(
        { error: authError.message || "Error en el registro de auth" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario" },
        { status: 500 }
      );
    }

    // 2. Hash password para la tabla seguridad.usuario
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // 3. Crear usuario en seguridad.usuario con rol administrador
    const { data: usuarioData, error: usuarioError } = await supabase
      .schema("seguridad")
      .from("usuario")
      .insert({
        nombres,
        apellidos,
        email,
        nombre_usuario: email.split("@")[0],
        password_hash: Buffer.from(passwordHash, "hex"),
        id_estado: 1, // Activo
      })
      .select("id_usuario")
      .single();

    if (usuarioError) {
      console.error("Usuario insert error:", usuarioError);
      // Intentar limpiar el usuario de auth si falló la creación en seguridad
      // Nota: Supabase no proporciona endpoint directo para eliminar en server, 
      // así que dejamos un usuario huérfano - considera un trigger en BD
      return NextResponse.json(
        { error: "Error al crear el usuario en seguridad: " + usuarioError.message },
        { status: 500 }
      );
    }

    // 4. Asignar rol "administrador"
    const { error: rolError } = await supabase
      .schema("seguridad")
      .from("usuario_rol")
      .insert({
        id_usuario: usuarioData.id_usuario,
        id_rol: 1, // Asume que id_rol=1 es "administrador"
      });

    if (rolError) {
      console.error("Rol assignment error:", rolError);
      // Log pero no fallar - el usuario existe, solo sin rol
      console.warn(`Usuario ${usuarioData.id_usuario} creado pero sin rol asignado`);
    }

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente",
      user_id: authData.user.id,
    });
  } catch (err: any) {
    console.error("Sign-up endpoint error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
