import pool from "../config/db.js";

const historial = {
  // Obtener todo el historial
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM historial");
    return rows.map((row) => ({
      ...row,
      // Aseguramos que los valores numéricos se traten como tal
      Costo: row.Costo ? Number(row.Costo) : 0,
    }));
  },

  // Buscar un registro por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM historial WHERE ID_HISTORIAL = ?",
      [id]
    );
    if (!rows.length) return null;
    return {
      ...rows[0],
      Costo: rows[0].Costo ? Number(rows[0].Costo) : 0,
    };
  },

  // Crear un nuevo registro de historial
  create: async (data) => {
    const { ID_HISTORIAL, ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo } = data;
    const [result] = await pool.query(
      `INSERT INTO historial (ID_HISTORIAL, ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ID_HISTORIAL, ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo]
    );
    return result;
  },

  // Actualizar un registro existente
  update: async (id, data) => {
    const { ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo } = data;
    const [result] = await pool.query(
      `UPDATE historial
       SET ID_MOTOS = ?, Fecha = ?, Descripcion = ?, Diagnostico = ?, Costo = ?
       WHERE ID_HISTORIAL = ?`,
      [ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo, id]
    );
    return result;
  },

  // Eliminar un registro
  delete: async (id) => {
    await pool.query("DELETE FROM historial WHERE ID_HISTORIAL = ?", [id]);
    return true;
  },
};

export default historial;