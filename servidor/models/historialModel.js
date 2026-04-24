import pool from "../config/db.js";

const historial = {
  // Obtener todo el historial
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM historial");
    return rows;
  },

  // Buscar un registro por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM historial WHERE ID_HISTORIAL = ?",
      [id]
    );
    return rows[0] || null;
  },

  // Crear un nuevo registro de historial
  create: async (data) => {
    const {
      ID_HISTORIAL,
      ID_ORDEN_SERVICIO,
      ID_COMPROBANTE,
      ID_INFORME,
      ID_TECNICOS,
      ID_CLIENTES,
      Descripcion,
      Fecha_registro,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO historial
       (ID_HISTORIAL, ID_ORDEN_SERVICIO, ID_COMPROBANTE, ID_INFORME, ID_TECNICOS, ID_CLIENTES, Descripcion, Fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_HISTORIAL,
        ID_ORDEN_SERVICIO || null,
        ID_COMPROBANTE || null,
        ID_INFORME || null,
        ID_TECNICOS || null,
        ID_CLIENTES || null,
        Descripcion,
        Fecha_registro || new Date(),
      ]
    );
    return result;
  },

  // Actualizar un registro existente
  update: async (id, data) => {
    const {
      ID_ORDEN_SERVICIO,
      ID_COMPROBANTE,
      ID_INFORME,
      ID_TECNICOS,
      ID_CLIENTES,
      Descripcion,
      Fecha_registro,
    } = data;

    const [result] = await pool.query(
      `UPDATE historial
       SET ID_ORDEN_SERVICIO = ?,
           ID_COMPROBANTE = ?,
           ID_INFORME = ?,
           ID_TECNICOS = ?,
           ID_CLIENTES = ?,
           Descripcion = ?,
           Fecha_registro = ?
       WHERE ID_HISTORIAL = ?`,
      [
        ID_ORDEN_SERVICIO || null,
        ID_COMPROBANTE || null,
        ID_INFORME || null,
        ID_TECNICOS || null,
        ID_CLIENTES || null,
        Descripcion,
        Fecha_registro,
        id,
      ]
    );
    return result;
  },

  // Eliminar un registro
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM historial WHERE ID_HISTORIAL = ?",
      [id]
    );
    return result;
  },
};

export default historial;