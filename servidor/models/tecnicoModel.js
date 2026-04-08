import pool from "../config/db.js"; // Importamos el pool de conexiones a la base de datos para poder realizar consultas SQL desde este modelo. 
import bcrypt from 'bcrypt'; // Importamos bcrypt para poder encriptar las contraseñas antes de almacenarlas en la base de datos, lo cual es una buena práctica de seguridad. 

const tecnicos = { // Definimos un objeto 'tecnicos' que contendrá métodos para interactuar con la tabla 'tecnicos' en la base de datos. Cada método corresponde a una operación CRUD (Crear, Leer, Actualizar, Eliminar) o a una consulta específica. 
  // 1. Obtener todos los tecnicos
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM tecnicos");
    return rows;
  },

  // 2. Buscamos por ID_TECNICOS
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM tecnicos WHERE ID_TECNICOS = ?",
      [id]
    );
    return rows[0];
  },

  // 3. Crear un nuevo registro
create: async (data) => {

  const { ID_TECNICOS, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono } = data;

  // encriptar contraseña
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

  // 4. Actualizar tecnicos (EL QUE FALTABA)
  update: async (id, data) => {
    const {ID_TECNICOS, Nombre, usuario, contrasena, TipoDocumento, Correo, Telefono } = data;

    let passwordHash = contrasena;
    if (contrasena) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(contrasena, saltRounds);
    }

    const [result] = await pool.query(
      `UPDATE tecnicos 
       SET ID_TECNICOS = ?, Nombre = ?, usuario = ?, contrasena = ?, 
           TipoDocumento = ?, Correo = ?, Telefono = ?
       WHERE ID_TECNICOS = ?`,
      [ID_TECNICOS, Nombre, usuario, passwordHash, TipoDocumento, Correo, Telefono, id]
    );

    return result;
  },

  // 5. Eliminar tecnicos
  delete: async (id) => {
    await pool.query(
      "DELETE FROM tecnicos WHERE ID_TECNICOS = ?",
      [id]
    );
    return true;
  }
};

export default tecnicos;
