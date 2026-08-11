import pool from "../config/db.js";
import bcrypt from 'bcrypt';

// ============================================================
// RFN-001: Encriptación de contraseñas con bcrypt (10 rounds)
// RFN-001: Nunca mostrar contraseñas en respuestas
// ============================================================

// Columnas seguras (SIN password) para usar en SELECT
const COLUMNAS_SEGURAS = 'id_usuario, id_rol, id_tipo_documento, numero_documento, nombre, ciudad, usuario, correo, telefono, estado';

const Usuario = {
  // Obtener todos (opcionalmente filtrados por rol) — SIN password
  findAll: async (conditions = {}) => {
    let query = `SELECT ${COLUMNAS_SEGURAS} FROM usuarios`;
    const params = [];
    if (conditions.where) {
      const keys = Object.keys(conditions.where);
      if (keys.length > 0) {
        query += " WHERE " + keys.map(k => `${k} = ?`).join(" AND ");
        params.push(...keys.map(k => conditions.where[k]));
      }
    }
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Buscar por número de documento — SIN password
  findByPk: async (numero_documento) => {
    const [rows] = await pool.query(
      `SELECT ${COLUMNAS_SEGURAS} FROM usuarios WHERE numero_documento = ?`,
      [numero_documento]
    );
    return rows[0];
  },

  // Buscar un registro por condición — SIN password
  findOne: async (conditions) => {
    const { where } = conditions;
    if (!where) return null;
    const keys = Object.keys(where);
    if (keys.length === 0) return null;
    
    const query = `SELECT ${COLUMNAS_SEGURAS} FROM usuarios WHERE ` + keys.map(k => `${k} = ?`).join(" AND ");
    const params = keys.map(k => where[k]);
    
    const [rows] = await pool.query(query, params);
    return rows[0];
  },

  // Buscar un registro CON password — SOLO para login
  findOneWithPassword: async (conditions) => {
    const { where } = conditions;
    if (!where) return null;
    const keys = Object.keys(where);
    if (keys.length === 0) return null;

    const query = `SELECT * FROM usuarios WHERE ` + keys.map(k => `${k} = ?`).join(" AND ");
    const params = keys.map(k => where[k]);

    const [rows] = await pool.query(query, params);
    return rows[0];
  },

  // Crear nuevo usuario — RFN-001: bcrypt con 10 rounds mínimo
  create: async (data) => {
    const { id_rol, id_tipo_documento, numero_documento, nombre, ciudad, usuario, password, correo, telefono } = data;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const [result] = await pool.query(
      `INSERT INTO usuarios
       (id_rol, id_tipo_documento, numero_documento, nombre, ciudad, usuario, password, correo, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_rol, id_tipo_documento, numero_documento, nombre, ciudad, usuario, passwordHash, correo, telefono]
    );
    return result;
  },

  // Actualizar usuario — RFN-001: rehash password si se actualiza
  update: async (numero_documento_id, data) => {
    const existing = await Usuario.findByPk(numero_documento_id);
    if (!existing) {
      throw new Error('Usuario no encontrado');
    }

    const numero_documento = Object.prototype.hasOwnProperty.call(data, 'numero_documento') ? data.numero_documento : existing.numero_documento;
    const id_tipo_documento = Object.prototype.hasOwnProperty.call(data, 'id_tipo_documento') ? data.id_tipo_documento : existing.id_tipo_documento;
    const id_rol = Object.prototype.hasOwnProperty.call(data, 'id_rol') ? data.id_rol : existing.id_rol;
    const nombre = Object.prototype.hasOwnProperty.call(data, 'nombre') ? data.nombre : existing.nombre;
    const ciudad = Object.prototype.hasOwnProperty.call(data, 'ciudad') ? data.ciudad : existing.ciudad;
    const usuario = Object.prototype.hasOwnProperty.call(data, 'usuario') ? data.usuario : existing.usuario;
    const correo = Object.prototype.hasOwnProperty.call(data, 'correo') ? data.correo : existing.correo;
    const telefono = Object.prototype.hasOwnProperty.call(data, 'telefono') ? data.telefono : existing.telefono;
    const estado = Object.prototype.hasOwnProperty.call(data, 'estado') ? data.estado : existing.estado;

    let query = `UPDATE usuarios SET numero_documento = ?, id_tipo_documento = ?, id_rol = ?, nombre = ?, ciudad = ?, usuario = ?, correo = ?, telefono = ?, estado = ?`;
    let params = [numero_documento, id_tipo_documento, id_rol, nombre, ciudad, usuario, correo, telefono, estado];

    if (data.password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);
      query += `, password = ?`;
      params.push(passwordHash);
    }

    query += ` WHERE numero_documento = ?`;
    params.push(numero_documento_id);

    const [result] = await pool.query(query, params);
    return result;
  },

  // Eliminar usuario
  delete: async (numero_documento) => {
    await pool.query("DELETE FROM usuarios WHERE numero_documento = ?", [numero_documento]);
    return true;
  },

  // Guardar token de recuperación de contraseña
  setResetToken: async (correo, token, expiracion) => {
    const [result] = await pool.query(
      "UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE correo = ?",
      [token, expiracion, correo]
    );
    return result;
  },

  // Buscar usuario por token de recuperación
  findByResetToken: async (token) => {
    const [rows] = await pool.query(
      `SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()`,
      [token]
    );
    return rows[0];
  },

  // Actualizar la contraseña de un usuario directamente
  updatePassword: async (numero_documento, passwordHash) => {
    const [result] = await pool.query(
      "UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE numero_documento = ?",
      [passwordHash, numero_documento]
    );
    return result;
  }
};

export default Usuario;
