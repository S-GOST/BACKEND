import pool from "./config/db.js";

async function main() {
  const [pCols] = await pool.query("DESCRIBE productos");
  console.log("=== COLUMNAS productos ===");
  pCols.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Key}`));

  const [sCols] = await pool.query("DESCRIBE servicios");
  console.log("\n=== COLUMNAS servicios ===");
  sCols.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Key}`));

  // test the query
  const query = `
      SELECT 
        dos.id_detalle AS ID_DETALLES_ORDEN_SERVICIO,
        dos.id_orden AS ID_ORDEN_SERVICIO,
        dos.ID_SERVICIOS,
        dos.ID_PRODUCTOS,
        s.nombre AS NombreServicio,
        p.nombre AS NombreProducto,
        dos.cantidad,
        dos.garantia AS Garantia,
        dos.precio_unitario AS Precio,
        dos.subtotal
      FROM detalles_orden_servicio dos
      LEFT JOIN servicios s ON dos.ID_SERVICIOS = s.id_servicio
      LEFT JOIN productos p ON dos.ID_PRODUCTOS = p.id_producto
      WHERE dos.id_orden = ?
    `;
    try {
      const [rows] = await pool.query(query, [1]);
      console.log("\n=== TEST QUERY RESULT ===");
      console.log(JSON.stringify(rows, null, 2));
    } catch(e) { console.error("Error in query:", e); }

  process.exit(0);
}

main().catch(console.error);
