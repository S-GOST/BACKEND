import pool from "../config/db.js";

const Administrador = {
  // 1. Obtener todos los administradores
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM administradores");
    return rows;
  },

  // 2. Buscar por ID_ADMINISTRADOR
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM administradores WHERE ID_ADMINISTRADOR = ?",
      [id]
    );
    return rows[0];
  },

  // 3. Crear un nuevo registro
  create: async (data) => {
    const {  Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono } = data;

    const [result] = await pool.query(
      `INSERT INTO administradores 
      ( Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono]
    );

    return result;
  },

  // 4. Actualizar administrador (EL QUE FALTABA)
  update: async (id, data) => {
    const { Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono } = data;

    const [result] = await pool.query(
      `UPDATE administradores 
       SET Nombre = ?, usuario = ?, contrasena = ?, 
           Correo = ?, TipoDocumento = ?, Telefono = ?
       WHERE ID_ADMINISTRADOR = ?`,
      [Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono, id]
    );

    return result;
  },

  // 5. Eliminar administrador
  delete: async (id) => {
    await pool.query(
      "DELETE FROM administradores WHERE ID_ADMINISTRADOR = ?",
      [id]
    );
    return true;
  }
};

export default Administrador;