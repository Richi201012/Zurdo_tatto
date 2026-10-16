import { migrate } from "drizzle-orm/postgres-js/migrator";
import { loadEnvConfig } from "@next/env";
import { closeDatabase, getDatabase } from "./index";

loadEnvConfig(process.cwd());

async function main() {
  await migrate(getDatabase(), { migrationsFolder: "db/migrations" });
  await closeDatabase();
  console.log("Migraciones aplicadas correctamente.");
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await closeDatabase();
  process.exit(1);
});
