import pool from "../config/db.js";

const historial = {
  // Obtener todo el historial
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM historial ORDER BY fecha DESC");
    return rows;
  },

  // Buscar un registro por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM historial WHERE id_historial = ?",
      [id]
    );
    return rows[0] || null;
  },

  // Crear un nuevo registro de historial
  create: async (data) => {
    const {
      id_usuario,
      tabla_afectada,
      id_registro,
      accion,
      descripcion
    } = data;

    const [result] = await pool.query(
      `INSERT INTO historial
       (id_usuario, tabla_afectada, id_registro, accion, descripcion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_usuario,
        tabla_afectada,
        id_registro,
        accion,
        descripcion || null
      ]
    );
    return result;
  },

  // Actualizar un registro existente (raramente usado en historiales, pero mantenido por compatibilidad)
  update: async (id, data) => {
    const {
      id_usuario,
      tabla_afectada,
      id_registro,
      accion,
      descripcion
    } = data;

    const [result] = await pool.query(
      `UPDATE historial
       SET id_usuario = ?,
           tabla_afectada = ?,
           id_registro = ?,
           accion = ?,
           descripcion = ?
       WHERE id_historial = ?`,
      [
        id_usuario,
        tabla_afectada,
        id_registro,
        accion,
        descripcion || null,
        id
      ]
    );
    return result;
  },

  // Eliminar un registro
  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM historial WHERE id_historial = ?",
      [id]
    );
    return result;
  },
};

export default historial;