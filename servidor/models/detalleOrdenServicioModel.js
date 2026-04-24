import pool from "../config/db.js"; // Importamos el pool de conexiones

const DetalleOrdenServicio = {
  // 1. Obtener todos los detalles de orden de servicio
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM detalles_orden_servicio");
    return rows;
  },

  // 2. Buscar un detalle de orden por su ID (clave primaria)
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM detalles_orden_servicio WHERE ID_DETALLES_ORDEN_SERVICIO = ?",
      [id]
    );
    return rows[0];
  },

  // 3. Crear un nuevo detalle de orden de servicio
  create: async (data) => {
    const {
      ID_DETALLES_ORDEN_SERVICIO,
      ID_ORDEN_SERVICIO,
      ID_SERVICIOS,
      ID_PRODUCTOS,
      Garantia,
      Estado,
      Precio,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO detalles_orden_servicio
       (ID_DETALLES_ORDEN_SERVICIO, ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantia, Estado, Precio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_DETALLES_ORDEN_SERVICIO,
        ID_ORDEN_SERVICIO,
        ID_SERVICIOS || null,   // Si no viene, se guarda NULL
        ID_PRODUCTOS || null,   // Si no viene, se guarda NULL
        Garantia,
        Estado,
        Precio,
      ]
    );

    return result;
  },

  // 4. Actualizar un detalle de orden existente (sin modificar la clave primaria)
  update: async (id, data) => {
    const {
      ID_ORDEN_SERVICIO,
      ID_SERVICIOS,
      ID_PRODUCTOS,
      Garantia,
      Estado,
      Precio,
    } = data;

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
        id,  // Aquí va el ID del detalle (condición WHERE)
      ]
    );

    return result;
  },

  // 5. Eliminar un detalle de orden de servicio
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM detalles_orden_servicio WHERE ID_DETALLES_ORDEN_SERVICIO = ?",
      [id]
    );
    return result;
  },
};

export default DetalleOrdenServicio;