import pool from "../config/db.js";
import bcrypt from "bcrypt";

const clientes = {
  // 1. Obtener todos los clientes
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM clientes");
    return rows;
  },

  // 2. Buscar un cliente por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM clientes WHERE ID_CLIENTES = ?",
      [id]
    );
    return rows[0];
  },

  // Alias para findByPk (compatible con Sequelize)
  findByPk: async (id) => {
    return await clientes.findById(id);
  },

  // 3. Buscar un registro por condición (ej: { where: { usuario: '...' } })
  findOne: async (conditions) => {
    const { where } = conditions;
    if (!where) return null;
    const campo = Object.keys(where)[0];
    const valor = where[campo];
    const [rows] = await pool.query(
      `SELECT * FROM clientes WHERE ${campo} = ?`,
      [valor]
    );
    return rows[0];
  },

  // 4. Crear un nuevo cliente
  create: async (data) => {
    const { ID_CLIENTES, Ubicacion, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono } = data;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(contrasena, saltRounds);

    const [result] = await pool.query(
      `INSERT INTO clientes
      (ID_CLIENTES, Ubicacion, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_CLIENTES, Ubicacion, Nombre, usuario, passwordHash, TipoDocumento, Correo, Telefono]
    );

    return result;
  },

  // 5. Actualizar cliente existente
  update: async (id, data) => {
    const { ID_CLIENTES, Ubicacion, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono } = data;

    if (contrasena) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(contrasena, saltRounds);

      const [result] = await pool.query(
        `UPDATE clientes
         SET ID_CLIENTES = ?, Ubicacion = ?, Nombre = ?, usuario = ?, contrasena = ?, TipoDocumento = ?, Correo = ?, Telefono = ?
         WHERE ID_CLIENTES = ?`,
        [ID_CLIENTES, Ubicacion, Nombre, usuario, passwordHash, TipoDocumento, Correo, Telefono, id]
      );

      return result;
    }

    const [result] = await pool.query(
      `UPDATE clientes
       SET ID_CLIENTES = ?, Ubicacion = ?, Nombre = ?, usuario = ?, TipoDocumento = ?, Correo = ?, Telefono = ?
       WHERE ID_CLIENTES = ?`,
      [ID_CLIENTES, Ubicacion, Nombre, usuario, TipoDocumento, Correo, Telefono, id]
    );

    return result;
  },

  // 6. Eliminar cliente
  delete: async (id) => {
    await pool.query(
      "DELETE FROM clientes WHERE ID_CLIENTES = ?",
      [id]
    );
    return true;
  }
};

export default clientes;