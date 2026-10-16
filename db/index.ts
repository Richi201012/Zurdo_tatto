import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada. Agrégala a .env antes de usar PostgreSQL.");
  if (!client) {
    client = postgres(connectionString, { max: process.env.NODE_ENV === "production" ? 10 : 3, prepare: false });
    database = drizzle(client, { schema });
  }
  return database!;
}

export async function closeDatabase() {
  if (client) await client.end();
  client = null;
  database = null;
}
