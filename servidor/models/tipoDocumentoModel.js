import pool from "../config/db.js";

const TipoDocumento = {
  // Obtener todos los tipos de documento
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM tipo_documento");
    return rows;
  },

  // Buscar por ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM tipo_documento WHERE id_tipo_documento = ?",
      [id]
    );
    return rows[0];
  }
};

export default TipoDocumento;
