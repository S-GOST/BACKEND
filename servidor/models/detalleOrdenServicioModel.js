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

  // 🔥 3. NUEVO: Buscar detalles por ID de Orden de Servicio (Esencial para tu app)
  findByOrderId: async (idOrden) => {
    const [rows] = await pool.query(
      "SELECT * FROM detalles_orden_servicio WHERE ID_ORDEN_SERVICIO = ?",
      [idOrden]
    );
    return rows;
  },

  // 4. Crear un solo detalle
  create: async (data) => {
    const { ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Estado, Precio } = data;
    
    const [result] = await pool.query(
      `INSERT INTO detalles_orden_servicio
       (ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Estado, Precio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ID_ORDEN_SERVICIO,
        ID_SERVICIOS || null,
        ID_PRODUCTOS || null,
        Garantia,
        Estado,
        Precio
      ]
    );

    // Retorna el ID generado por MySQL (asumiendo AUTO_INCREMENT)
    return { idDetalle: result.insertId, ...data };
  },

  // 🔥 5. NUEVO: Crear múltiples detalles (Ideal para guardar el carrito en 1 sola query)
  createMany: async (detailsArray) => {
    if (!detailsArray || detailsArray.length === 0) return [];

    const values = detailsArray.map(d => [
      d.ID_ORDEN_SERVICIO,
      d.ID_SERVICIOS || null,
      d.ID_PRODUCTOS || null,
      d.Garantia,
      d.Estado,
      d.Precio
    ]);

    const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
    const query = `INSERT INTO detalles_orden_servicio
                   (ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Estado, Precio)
                   VALUES ${placeholders}`;

    const [result] = await pool.query(query, values.flat());
    return result;
  },

  // 6. Actualizar un detalle
  update: async (id, data) => {
    const { ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Estado, Precio } = data;

    const [result] = await pool.query(
      `UPDATE detalles_orden_servicio
       SET ID_ORDEN_SERVICIO = ?,
           ID_SERVICIOS = ?,
           ID_PRODUCTOS = ?,
           Garantia = ?,
           Estado = ?,
           Precio = ?
       WHERE ID_DETALLES_ORDEN_SERVICIO = ?`,
      [
        ID_ORDEN_SERVICIO,
        ID_SERVICIOS || null,
        ID_PRODUCTOS || null,
        Garantia,
        Estado,
        Precio,
        id
      ]
    );

    return result;
  },

  // 7. Eliminar un detalle
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM detalles_orden_servicio WHERE ID_DETALLES_ORDEN_SERVICIO = ?",
      [id]
    );
    return result;
  }
};

export default DetalleOrdenServicio;