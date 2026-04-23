import pool from "../config/db.js";

const OrdenServicio = {
  // Obtener todas las órdenes de servicio
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM orden_servicio");
    return rows;
  },

  // Buscar una orden por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?",
      [id]
    );
    return rows[0];
  },

  // Crear una nueva orden
  create: async (data) => {
    const {
      ID_ORDEN_SERVICIO,
      ID_CLIENTES,
      ID_ADMINISTRADOR,
      ID_TECNICOS,
      ID_MOTOS,
      Fecha_inicio,
      Fecha_estimada,
      Fecha_fin,
      Estado,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO orden_servicio 
       (ID_ORDEN_SERVICIO, ID_CLIENTES, ID_ADMINISTRADOR, ID_TECNICOS, ID_MOTOS, 
        Fecha_inicio, Fecha_estimada, Fecha_fin, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_ORDEN_SERVICIO,
        ID_CLIENTES,
        ID_ADMINISTRADOR,
        ID_TECNICOS,
        ID_MOTOS,
        Fecha_inicio,
        Fecha_estimada,
        Fecha_fin,
        Estado,
      ]
    );

    return result;
  },

  // Actualizar una orden existente (no se modifica el ID)
  update: async (id, data) => {
    const {
      ID_CLIENTES,
      ID_ADMINISTRADOR,
      ID_TECNICOS,
      ID_MOTOS,
      Fecha_inicio,
      Fecha_estimada,
      Fecha_fin,
      Estado,
    } = data;

    const [result] = await pool.query(
      `UPDATE orden_servicio 
       SET ID_CLIENTES = ?, 
           ID_ADMINISTRADOR = ?, 
           ID_TECNICOS = ?, 
           ID_MOTOS = ?, 
           Fecha_inicio = ?, 
           Fecha_estimada = ?, 
           Fecha_fin = ?, 
           Estado = ?
       WHERE ID_ORDEN_SERVICIO = ?`,
      [
        ID_CLIENTES,
        ID_ADMINISTRADOR,
        ID_TECNICOS,
        ID_MOTOS,
        Fecha_inicio,
        Fecha_estimada,
        Fecha_fin,
        Estado,
        id,
      ]
    );

    return result;
  },

  // Eliminar una orden
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?",
      [id]
    );
    return result;
  },
};

export default OrdenServicio;