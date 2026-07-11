import pool from "./config/db.js";

async function run() {
  try {
    const [rows] = await pool.query("DESCRIBE detalles_orden_servicio");
    console.log("detalles_orden_servicio schema:");
    console.table(rows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
run();
