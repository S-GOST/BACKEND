import pool from "./config/db.js";

async function run() {
  try {
    // We should be careful about foreign key constraints, maybe we need to delete detalles first
    await pool.query("DELETE FROM detalles_orden_servicio");
    await pool.query("DELETE FROM orden_servicio");
    await pool.query("ALTER TABLE detalles_orden_servicio AUTO_INCREMENT = 1");
    await pool.query("ALTER TABLE orden_servicio AUTO_INCREMENT = 1");
    console.log("Tablas de ordenes reseteadas a ID 1.");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
run();
