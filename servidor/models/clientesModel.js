import pool from "../config/db.js"; // Importamos el pool de conexiones para interactuar con la base de datos.
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

  // 3. Crear un nuevo cliente
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

  // 4. Actualizar cliente existente
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

  // 5. Eliminar cliente
  delete: async (id) => {
    await pool.query(
      "DELETE FROM clientes WHERE ID_CLIENTES = ?",
      [id]
    );
    return true;
  }
};

export default clientes;
