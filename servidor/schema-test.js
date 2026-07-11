import pool from "./config/db.js";

async function run() {
  try {
    const [rows] = await pool.query("DESCRIBE usuarios");
    console.log("Usuarios schema:");
    console.table(rows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
run();
