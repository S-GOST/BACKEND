import pool from "../config/db.js";
import bcrypt from 'bcrypt';

const Administrador = {
  // Obtener todos
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM administradores");
    return rows;
  },

  // Buscar por ID (para findByPk)
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM administradores WHERE ID_ADMINISTRADOR = ?",
      [id]
    );
    return rows[0];
  },

  // Alias para findByPk (compatible con Sequelize)
  findByPk: async (id) => {
    return await Administrador.findById(id);
  },

  // Buscar un registro por condición (ej: { where: { usuario: '...' } })
  findOne: async (conditions) => {
    // Extraemos el campo y valor del objeto where
    const { where } = conditions;
    if (!where) return null;
    const campo = Object.keys(where)[0];
    const valor = where[campo];
    const [rows] = await pool.query(
      `SELECT * FROM administradores WHERE ${campo} = ?`,
      [valor]
    );
    return rows[0];
  },

  // Crear nuevo administrador
  create: async (data) => {
    const { ID_ADMINISTRADOR, Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono } = data;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(contrasena, saltRounds);
    const [result] = await pool.query(
      `INSERT INTO administradores
       (ID_ADMINISTRADOR, Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_ADMINISTRADOR, Nombre, usuario, passwordHash, Correo, TipoDocumento, Telefono]
    );
    return result;
  },

  // Actualizar administrador
  update: async (id, data) => {
    const { ID_ADMINISTRADOR, Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono } = data;
    if (contrasena) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(contrasena, saltRounds);
      const [result] = await pool.query(
        `UPDATE administradores 
         SET ID_ADMINISTRADOR = ?, Nombre = ?, usuario = ?, contrasena = ?, 
             Correo = ?, TipoDocumento = ?, Telefono = ?
         WHERE ID_ADMINISTRADOR = ?`,
        [ID_ADMINISTRADOR, Nombre, usuario, passwordHash, Correo, TipoDocumento, Telefono, id]
      );
      return result;
    } else {
      const [result] = await pool.query(
        `UPDATE administradores 
         SET ID_ADMINISTRADOR = ?, Nombre = ?, usuario = ?, 
             Correo = ?, TipoDocumento = ?, Telefono = ?
         WHERE ID_ADMINISTRADOR = ?`,
        [ID_ADMINISTRADOR, Nombre, usuario, Correo, TipoDocumento, Telefono, id]
      );
      return result;
    }
  },

  // Eliminar administrador
  delete: async (id) => {
    await pool.query("DELETE FROM administradores WHERE ID_ADMINISTRADOR = ?", [id]);
    return true;
  }
};

export default Administrador;