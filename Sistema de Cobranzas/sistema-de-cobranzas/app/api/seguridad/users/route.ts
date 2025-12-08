import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const client = await createClient();
    const { data, error } = await client.rpc('obtener_usuarios');

    if (error) {
      throw error;
    }

    // data is already JSONB, parse if needed
    const users = typeof data === 'string' ? JSON.parse(data) : (data || []);

    return NextResponse.json({ success: true, users });
  } catch (e: any) {
    console.error('Error fetching users:', e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombres, apellidos, telefono, nombre_usuario, email, password } = body;
    if (!nombres || !apellidos || !email) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const client = await createClient();

    // Hash password server-side (sha256) - send as hex string
    let password_hash_hex: string | null = null;
    if (password) {
      password_hash_hex = crypto.createHash('sha256').update(password).digest('hex');
    }

    const username = nombre_usuario && nombre_usuario.trim() !== ''
      ? nombre_usuario
      : (email ? email.split('@')[0] : 'usuario');

    const { data, error } = await client.rpc('crear_usuario', {
      p_nombres: nombres,
      p_apellidos: apellidos,
      p_telefono: telefono ?? null,
      p_nombre_usuario: username,
      p_email: email,
      p_password_hash: password_hash_hex,
      p_id_estado: 1
    });

    if (error) {
      throw error;
    }

    // Check if RPC returned an error in data
    if (data && typeof data === 'object' && data.success === false) {
      throw new Error(data.error || 'Error creating user');
    }

    return NextResponse.json({ success: true, user: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
