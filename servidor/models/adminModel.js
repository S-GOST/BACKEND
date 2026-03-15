import pool from "../config/db.js";
import bcrypt from 'bcrypt';

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

  const { ID_ADMINISTRADOR,Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono } = data;

  // encriptar contraseña
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

  // 4. Actualizar administrador (EL QUE FALTABA)
  update: async (id, data) => {
    const {ID_ADMINISTRADOR, Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono } = data;

    const [result] = await pool.query(
      `UPDATE administradores 
       SET ID_ADMINISTRADOR = ?, Nombre = ?, usuario = ?, contrasena = ?, 
           Correo = ?, TipoDocumento = ?, Telefono = ?
       WHERE ID_ADMINISTRADOR = ?`,
      [ID_ADMINISTRADOR, Nombre, usuario, contrasena, Correo, TipoDocumento, Telefono, id]
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