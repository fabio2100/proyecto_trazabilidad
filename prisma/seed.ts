import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_PRISMA_DATABASE_URL,
});

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Perfiles
    await client.query(`
      INSERT INTO "Perfiles" (id, tipo) VALUES
        (1, 'administrativo'),
        (2, 'tecnico'),
        (3, 'medico'),
        (4, 'superusuario')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("Perfiles insertados.");

    // Functions
    await client.query(`
      INSERT INTO "Functions" (id, name) VALUES
        (1, 'Informar'),
        (2, 'Notas del tecnico')
      ON CONFLICT (id) DO NOTHING
    `);

    const functionsResult = await client.query(`
      SELECT id, name
      FROM "Functions"
      WHERE name IN ('Informar', 'Notas del tecnico')
    `);

    const informarId = functionsResult.rows.find((r: { id: number; name: string }) => r.name === "Informar")?.id;
    const notasTecnicoId = functionsResult.rows.find((r: { id: number; name: string }) => r.name === "Notas del tecnico")?.id;

    if (!informarId || !notasTecnicoId) {
      throw new Error("No se pudieron resolver los IDs de las funciones seed.");
    }

    console.log(`Function "Informar" id=${informarId}, "Notas del tecnico" id=${notasTecnicoId}.`);

    // PerfilesFunctions: medico (3) y superusuario (4) -> Informar, tecnico (2) -> Notas del tecnico
    await client.query(
      `
      INSERT INTO "PerfilesFunctions" (perfil_id, function_id) VALUES
        (3, $1),
        (4, $1),
        (2, $2)
      ON CONFLICT DO NOTHING
    `,
      [informarId, notasTecnicoId],
    );
    console.log("PerfilesFunctions insertadas.");

    // Registrar la ejecución exitosa del seed
    await client.query(`
      INSERT INTO "SeedLog" (status, message, "executedAt") VALUES
        ('success', 'Seed completado exitosamente', NOW())
    `);
    console.log("Ejecución registrada en SeedLog.");

    await client.query("COMMIT");
    console.log("Seed completado.");
  } catch (e) {
    await client.query("ROLLBACK");

    // Intentar registrar el error (en conexión nueva si la transacción falló)
    try {
      const errorMsg = e instanceof Error ? e.message : String(e);
      await client.query(
        `
        INSERT INTO "SeedLog" (status, message, "executedAt") VALUES
          ('error', $1, NOW())
      `,
        [errorMsg],
      );
    } catch (logError) {
      console.error("No se pudo registrar el error en SeedLog:", logError);
    }
    throw e;
  } finally {
    client.release();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
