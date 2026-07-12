import pool from "./config/db.js";

async function run() {
  try {
    console.log("=== TABLA usuarios ===");
    const [userCols] = await pool.query("DESCRIBE usuarios");
    console.table(userCols);

    console.log("\n=== TABLA motos ===");
    const [motoCols] = await pool.query("DESCRIBE motos");
    console.table(motoCols);

    console.log("\n=== Ejemplo de usuario cliente (id_rol=3) ===");
    const [users] = await pool.query("SELECT * FROM usuarios WHERE id_rol = 3 LIMIT 3");
    console.table(users);

    console.log("\n=== Todas las motos ===");
    const [motos] = await pool.query("SELECT * FROM motos");
    console.table(motos);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
run();
