import pool from "../config/db.js"; // Importamos el pool de conexiones para interactuar con la base de datos.

const OrdenServicio = { 
  // 1. Obtener todas las órdenes de servicio
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM orden_servicio");
    return rows;
  },

  // 2. Buscar una orden de servicio por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?",
      [id]
    );
    return rows[0];
  },

  // 3. Crear una nueva orden de servicio
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
      Estado 
    } = data;

    const [result] = await pool.query(
      `INSERT INTO orden_servicio
      (ID_ORDEN_SERVICIO, ID_CLIENTES, ID_ADMINISTRADOR, ID_TECNICOS, ID_MOTOS, Fecha_inicio, Fecha_estimada, Fecha_fin, Estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_ORDEN_SERVICIO, ID_CLIENTES, ID_ADMINISTRADOR, ID_TECNICOS, ID_MOTOS, Fecha_inicio, Fecha_estimada, Fecha_fin, Estado]
    );

    return result;
  },

  // 4. Actualizar una orden de servicio existente
  update: async (id, data) => {
    const { 
      ID_CLIENTES, 
      ID_ADMINISTRADOR, 
      ID_TECNICOS, 
      ID_MOTOS, 
      Fecha_inicio, 
      Fecha_estimada, 
      Fecha_fin, 
      Estado 
    } = data;

    const [result] = await pool.query(
      `UPDATE orden_servicio 
      SET ID_CLIENTES = ?, ID_ADMINISTRADOR = ?, ID_TECNICOS = ?, ID_MOTOS = ?, Fecha_inicio = ?, Fecha_estimada = ?, Fecha_fin = ?, Estado = ?
      WHERE ID_ORDEN_SERVICIO = ?`,
      [ID_CLIENTES, ID_ADMINISTRADOR, ID_TECNICOS, ID_MOTOS, Fecha_inicio, Fecha_estimada, Fecha_fin, Estado, id]
    );

    return result;
  },

  // 5. Eliminar una orden de servicio
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?",
      [id]
    );

    return result;
  }
};

export default OrdenServicio;
