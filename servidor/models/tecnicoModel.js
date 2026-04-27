import pool from "../config/db.js";
import bcrypt from 'bcrypt';

const tecnicos = {
  // 1. Obtener todos los técnicos
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM tecnicos");
    return rows;
  },

  // 2. Buscar por ID_TECNICOS (para findByPk)
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM tecnicos WHERE ID_TECNICOS = ?",
      [id]
    );
    return rows[0];
  },

  // Alias para findByPk (compatible con Sequelize)
  findByPk: async (id) => {
    return await tecnicos.findById(id);
  },

  // 3. Buscar un registro por condición (ej: { where: { usuario: '...' } })
  findOne: async (conditions) => {
    const { where } = conditions;
    if (!where) return null;
    const campo = Object.keys(where)[0];
    const valor = where[campo];
    const [rows] = await pool.query(
      `SELECT * FROM tecnicos WHERE ${campo} = ?`,
      [valor]
    );
    return rows[0];
  },

  // 4. Crear un nuevo técnico (encripta la contraseña)
  create: async (data) => {
    const { ID_TECNICOS, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono } = data;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(contrasena, saltRounds);
    const [result] = await pool.query(
      `INSERT INTO tecnicos
       (ID_TECNICOS, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_TECNICOS, Nombre, usuario, passwordHash, TipoDocumento, Correo, Telefono]
    );
    return result;
  },

  // 5. Actualizar técnico
  update: async (id, data) => {
    const { ID_TECNICOS, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono } = data;

    // Si se proporciona una nueva contraseña, la encriptamos
    if (contrasena) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(contrasena, saltRounds);
      const [result] = await pool.query(
        `UPDATE tecnicos 
         SET ID_TECNICOS = ?, Nombre = ?, usuario = ?, contrasena = ?, 
             TipoDocumento = ?, Correo = ?, Telefono = ?
         WHERE ID_TECNICOS = ?`,
        [ID_TECNICOS, Nombre, usuario, passwordHash, TipoDocumento, Correo, Telefono, id]
      );
      return result;
    } else {
      // Si no hay contraseña nueva, actualizamos el resto dejando la contraseña actual intacta
      const [result] = await pool.query(
        `UPDATE tecnicos 
         SET ID_TECNICOS = ?, Nombre = ?, usuario = ?, 
             TipoDocumento = ?, Correo = ?, Telefono = ?
         WHERE ID_TECNICOS = ?`,
        [ID_TECNICOS, Nombre, usuario, TipoDocumento, Correo, Telefono, id]
      );
      return result;
    }
  },

  // 6. Eliminar técnico
  delete: async (id) => {
    await pool.query("DELETE FROM tecnicos WHERE ID_TECNICOS = ?", [id]);
    return true;
  }
};

export default tecnicos;