import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StrategiesPage() {
  const supabase = await createClient();

  // First try RPC 'get_carteras' which is schema-safe
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_carteras");

  if (rpcError) {
    // If RPC failed, provide helpful message and SQL to create the function
    console.error("RPC get_carteras error:", rpcError);

    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Carteras</h2>
        <div className="text-sm text-destructive mb-4">Error al obtener carteras vía RPC: {rpcError.message}</div>

        <div className="text-sm mb-2">Si aún no creaste la función RPC, ejecuta en el SQL editor de Supabase:</div>
        <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2 text-xs overflow-auto">{`CREATE OR REPLACE FUNCTION modulo_estrategias.get_carteras()
RETURNS SETOF modulo_estrategias.cartera AS $$
  SELECT * FROM modulo_estrategias.cartera;
$$ LANGUAGE sql STABLE;`}</pre>

        <div className="text-sm mt-3">Después de crear la función, recarga esta página.</div>
      </div>
    );
  }

  const rows = (rpcData as any[]) ?? [];

  return (
    <div className="p-4">
      {rows.length > 0 && (
        <div className="mb-4 text-xs text-slate-500">Debug: se encontraron {rows.length} carteras.</div>
      )}
      <h2 className="text-lg font-semibold mb-4">Carteras disponibles</h2>

      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No se encontraron carteras.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r, idx) => {
            // recursive search for an identifier value inside the row object
            function findId(obj: any, depth = 0): { key?: string; value?: any } | null {
              if (obj == null || depth > 3) return null;
              if (typeof obj !== "object") return null;

              // prefer exact column names we know
              const preferred = ["id_cartera", "id", "pk", "idCartera", "cartera_id", "id_cartera_pk"];
              for (const k of preferred) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) return { key: k, value: obj[k] };
              }

              // then try keys that include 'cartera' or end with '_id' or contain 'id' (case-insensitive)
              for (const k of Object.keys(obj)) {
                if (/cartera/i.test(k) || /_id$/i.test(k) || /^id$/i.test(k) || /\bid\b/i.test(k)) {
                  if (obj[k] !== null && obj[k] !== undefined) return { key: k, value: obj[k] };
                }
              }

              // fallback: check nested objects (one level deep)
              for (const k of Object.keys(obj)) {
                const v = obj[k];
                if (typeof v === "object" && v !== null) {
                  const found = findId(v, depth + 1);
                  if (found) return { key: `${k}.${found.key}`, value: found.value } as any;
                }
              }

              // last resort: any numeric-like property
              for (const k of Object.keys(obj)) {
                const v = obj[k];
                if (typeof v === "number" && Number.isInteger(v)) return { key: k, value: v };
                if (typeof v === "string" && /^\d+$/.test(v)) return { key: k, value: Number(v) };
              }

              return null;
            }

            const found = findId(r);
            const rawId = found?.value ?? null;
            const id = rawId !== null && rawId !== undefined ? String(rawId) : null;
            const label = r.nombre ?? r.name ?? (id ? `Cartera ${id}` : "Cartera (sin id)");

            if (!id) {
              return (
                <div
                  key={idx}
                  className="block w-full p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500"
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-slate-400 mt-2">Registro sin identificador válido</div>
                  <details className="mt-2 text-xs text-slate-600">
                    <summary>Ver datos</summary>
                    <pre className="mt-2 bg-white dark:bg-slate-800 p-2 rounded text-xs overflow-auto">{JSON.stringify(r, null, 2)}</pre>
                  </details>
                </div>
              );
            }

            return (
              <Link
                key={id}
                href={`/modules/strategies/${encodeURIComponent(id)}`}
                className="block w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:shadow-md hover:scale-[1.01] transform transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-slate-500">id: <span className="font-mono">{id}</span></div>
                </div>
                {r.descripcion ? (
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">{r.descripcion}</div>
                ) : null}
                <details className="mt-2 text-xs text-slate-600">
                  <summary>Ver datos</summary>
                  <pre className="mt-2 bg-white dark:bg-slate-800 p-2 rounded text-xs overflow-auto">{JSON.stringify(r, null, 2)}</pre>
                </details>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
