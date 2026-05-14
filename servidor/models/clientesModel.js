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
    const existing = await clientes.findByPk(id);
    if (!existing) {
      throw new Error('Cliente no encontrado');
    }

    const ID_CLIENTES = Object.prototype.hasOwnProperty.call(data, 'ID_CLIENTES')
      ? data.ID_CLIENTES
      : existing.ID_CLIENTES;
    const Ubicacion = Object.prototype.hasOwnProperty.call(data, 'Ubicacion')
      ? data.Ubicacion
      : existing.Ubicacion;
    const Nombre = Object.prototype.hasOwnProperty.call(data, 'Nombre')
      ? data.Nombre
      : existing.Nombre;
    const usuario = Object.prototype.hasOwnProperty.call(data, 'usuario')
      ? data.usuario
      : existing.usuario;
    const TipoDocumento = Object.prototype.hasOwnProperty.call(data, 'TipoDocumento')
      ? data.TipoDocumento
      : existing.TipoDocumento;
    const Correo = Object.prototype.hasOwnProperty.call(data, 'Correo')
      ? data.Correo
      : existing.Correo;
    const Telefono = Object.prototype.hasOwnProperty.call(data, 'Telefono')
      ? data.Telefono
      : existing.Telefono;

    if (data.contrasena) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.contrasena, saltRounds);

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