import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  // Basic env check
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, message: "Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" },
      { status: 400 },
    );
  }

  // Create a supabase server client and perform a minimal request to verify network connectivity.
  try {
    const supabase = createServerClient(url, key);

    // Intentionally run a simple query. The table may not exist — that's okay.
    // We treat any response (data or error) as proof that the client reached Supabase.
    const { data, error, status } = await supabase
      // Use a likely-nonexistent public table; this will still exercise the network call.
      .from("_test_connection_probe")
      .select("*")
      .limit(1);

    return NextResponse.json({ ok: true, env: { urlPresent: !!url, keyPresent: !!key }, probe: { status, data, error } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: "Error conectando a Supabase", detail: err?.message || String(err) }, { status: 500 });
  }
}
