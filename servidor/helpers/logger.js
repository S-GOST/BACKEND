import pool from '../config/db.js';

export const registrarHistorial = async ({ id_usuario, tabla_afectada, id_registro, accion, descripcion = '', datos_antes = null, datos_despues = null }) => {
  try {
    const userId = id_usuario || 1;

    await pool.query(
      `INSERT INTO historial (id_usuario, tabla_afectada, id_registro, accion, descripcion, datos_antes, datos_despues)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tabla_afectada,
        id_registro,
        accion,
        descripcion,
        datos_antes ? JSON.stringify(datos_antes) : null,
        datos_despues ? JSON.stringify(datos_despues) : null,
      ]
    );
  } catch (error) {
    console.error('?? [AUDITORÍA] Error al registrar en historial:', error.message);
  }
};
