import pool from "../config/db.js";

const DetalleOrdenServicio = {
  // 1. Obtener todos los detalles
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM detalles_orden_servicio");
    return rows;
  },

  // 2. Buscar por ID del detalle (PK)
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM detalles_orden_servicio WHERE ID_DETALLES_ORDEN_SERVICIO = ?",
      [id]
    );
    return rows[0] || null;
  },

findByOrderId: async (idOrden) => {
  const query = `
    SELECT 
      dos.ID_DETALLES_ORDEN_SERVICIO,
      dos.ID_ORDEN_SERVICIO,
      s.Nombre AS NombreServicio,
      p.Nombre AS NombreProducto,
      dos.Garantia,
      dos.Precio
    FROM detalles_orden_servicio dos
    LEFT JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
    LEFT JOIN productos p ON dos.ID_PRODUCTOS = p.ID_PRODUCTOS
    WHERE dos.ID_ORDEN_SERVICIO = ?
  `;
  const [rows] = await pool.query(query, [idOrden]);
  return rows;
},

  // 4. Crear un solo detalle
  create: async (data) => {
    const { ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Precio } = data;
  
    const [result] = await pool.query(
      `INSERT INTO detalles_orden_servicio
       (ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Precio)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ID_ORDEN_SERVICIO,
        ID_SERVICIOS || null,
        ID_PRODUCTOS || null,
        Garantia,
        Precio
      ]
    );

    // Retorna el ID generado y los datos
    return { idDetalle: result.insertId, ...data };
  },

  // 5. Actualizar un detalle
  update: async (id, data) => {
    const { ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Precio } = data;

    const [result] = await pool.query(
      `UPDATE detalles_orden_servicio
       SET ID_ORDEN_SERVICIO = ?,
           ID_SERVICIOS = ?,
           ID_PRODUCTOS = ?,
           Garantia = ?,
           Precio = ?
       WHERE ID_DETALLES_ORDEN_SERVICIO = ?`,
      [
        ID_ORDEN_SERVICIO,
        ID_SERVICIOS || null,
        ID_PRODUCTOS || null,
        Garantia,
        Precio,
        id
      ]
    );

    return result;
  },

  // 6. Eliminar un detalle
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM detalles_orden_servicio WHERE ID_DETALLES_ORDEN_SERVICIO = ?",
      [id]
    );
    return result;
  }
};

export default DetalleOrdenServicio;