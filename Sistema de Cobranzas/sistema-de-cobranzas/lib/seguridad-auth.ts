import { createClient } from "@/lib/supabase/server";

/**
 * Valida que el usuario logueado sea administrador
 * Retorna { id_usuario, email } si es admin, o null si no lo es / no está autenticado
 */
export async function validateAdmin() {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Verificar que tenga rol administrador
    const { data: roleCheck, error: roleError } = await supabase
      .schema("seguridad")
      .from("usuario_rol")
      .select(`
        id_usuario,
        rol:rol(nombre)
      `)
      .eq("id_usuario", user.id)
      .eq("rol.nombre", "administrador")
      .single();

    if (roleError || !roleCheck) {
      return null;
    }

    return { id_usuario: user.id, email: user.email };
  } catch (err) {
    console.error("validateAdmin error:", err);
    return null;
  }
}
