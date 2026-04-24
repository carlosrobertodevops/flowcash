import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://flowcash:flowcash@127.0.0.1:5432/flowcash";

const client = new pg.Client({ connectionString });

async function addEnumValue(type: string, value: string) {
  await client.query(`ALTER TYPE ${type} ADD VALUE IF NOT EXISTS '${value}'`);
}

async function main() {
  await client.connect();

  await client
    .query("CREATE TYPE tenant_plan AS ENUM ('free', 'standard', 'business')")
    .catch((error: { code?: string }) => {
      if (error.code !== "42710") {
        throw error;
      }
    });

  await addEnumValue("user_role", "super-user");
  await addEnumValue("user_role", "standard");
  await addEnumValue("user_role", "free");

  console.log("SaaS enum upgrade concluido.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
