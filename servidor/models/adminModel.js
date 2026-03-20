import pool from "../config/db.js"; // Importamos el pool de conexiones a la base de datos para poder realizar consultas SQL desde este modelo. 
import bcrypt from 'bcrypt'; // Importamos bcrypt para poder encriptar las contraseñas antes de almacenarlas en la base de datos, lo cual es una buena práctica de seguridad. 

const Administrador = { // Definimos un objeto 'Administrador' que contendrá métodos para interactuar con la tabla 'administradores' en la base de datos. Cada método corresponde a una operación CRUD (Crear, Leer, Actualizar, Eliminar) o a una consulta específica. 
  // 1. Obtener todos los administradores
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM administradores");
    return rows;
  },

  // 2. Buscamos por ID_ADMINISTRADORES
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