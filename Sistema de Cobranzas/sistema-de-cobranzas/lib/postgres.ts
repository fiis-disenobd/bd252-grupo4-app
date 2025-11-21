import { Pool } from "pg";

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment");
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export type CarteraRow = {
  id_cartera: number;
  nombre: string;
  descripcion: string;
  mora_min: string; // numeric as string
  mora_max: string;
};

export async function queryCarteras(): Promise<CarteraRow[]> {
  const p = getPool();
  const client = await p.connect();
  try {
    // Ensure search path resolves to the correct schema
    await client.query("SET search_path TO modulo_estrategias, public");

    const res = await client.query(
      `SELECT id_cartera, nombre, descripcion, mora_min::text AS mora_min, mora_max::text AS mora_max
       FROM cartera
       ORDER BY id_cartera ASC`
    );

    return res.rows as CarteraRow[];
  } finally {
    client.release();
  }
}
