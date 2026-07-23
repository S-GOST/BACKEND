import pool from "../config/db.js";

const OrdenServicio = {
  findAll: async () => {
    const [rows] = await pool.query(`
      SELECT 
        id_orden AS ID_ORDEN_SERVICIO, 
        id_cliente AS ID_CLIENTES, 
        id_tecnico AS ID_TECNICOS, 
        id_moto AS ID_MOTOS, 
        fecha_ingreso AS Fecha_inicio, 
        fecha_estimada AS Fecha_estimada, 
        fecha_salida AS Fecha_fin, 
        estado AS Estado,
        observaciones,
        total
      FROM orden_servicio
    `);
    return rows;
  },

  // Buscar una orden por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT 
        id_orden AS ID_ORDEN_SERVICIO, 
        id_cliente AS ID_CLIENTES, 
        id_tecnico AS ID_TECNICOS, 
        id_moto AS ID_MOTOS, 
        fecha_ingreso AS Fecha_inicio, 
        fecha_estimada AS Fecha_estimada, 
        fecha_salida AS Fecha_fin, 
        estado AS Estado,
        observaciones,
        total
      FROM orden_servicio WHERE id_orden = ?`,
      [id]
    );
    return rows[0];
  },

  // Crear una nueva orden (el controlador ya hace su propia inserción, pero si se usa aquí, que use id_orden, etc)
  create: async (data) => {
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
      `INSERT INTO orden_servicio 
       (id_cliente, id_tecnico, id_moto, 
        fecha_ingreso, fecha_estimada, fecha_salida, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_CLIENTES,
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

  // Actualizar una orden existente
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
      observaciones,
    } = data;

    const [result] = await pool.query(
      `UPDATE orden_servicio 
       SET id_cliente = ?, 
           id_tecnico = ?, 
           id_moto = ?, 
           fecha_ingreso = ?, 
           fecha_estimada = ?, 
           fecha_salida = ?, 
           estado = ?,
           observaciones = ?
       WHERE id_orden = ?`,
      [
        ID_CLIENTES,
        ID_TECNICOS,
        ID_MOTOS,
        Fecha_inicio,
        Fecha_estimada,
        Fecha_fin,
        Estado,
        observaciones,
        id,
      ]
    );

    return result;
  },

  // Eliminar una orden (esto no se usa en el controlador porque lo sobrescribimos allá, pero lo arreglamos por si acaso)
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM orden_servicio WHERE id_orden = ?",
      [id]
    );
    return result;
  },
};

export default OrdenServicio;