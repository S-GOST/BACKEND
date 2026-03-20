import pool from "../config/db.js";

const Servicio = {
    // Obtener todos los servicios
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM servicios");
        return rows;
    },

    // Buscar un servicio por su Clave Primaria (ID)
    findByPk: async (id) => {
        const [rows] = await pool.query("SELECT * FROM servicios WHERE id_servicio = ?", [id]);
        return rows[0]; // Retornamos solo el objeto, no el array
    },

    // Crear un nuevo registro
    create: async (datos) => {
        const { nombre, descripcion, precio } = datos; // Ajusta estos campos según tu tabla
        const [result] = await pool.query(
            "INSERT INTO servicios (nombre, descripcion, precio) VALUES (?, ?, ?)",
            [nombre, descripcion, precio]
        );
        return { id: result.insertId, ...datos };
    },

    // Actualizar un registro existente
    update: async (id, datos) => {
        const { nombre, descripcion, precio } = datos;
        await pool.query(
            "UPDATE servicios SET nombre = ?, descripcion = ?, precio = ? WHERE id_servicio = ?",
            [nombre, descripcion, precio, id]
        );
        return { id, ...datos };
    },

    // Eliminar un registro
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM servicios WHERE id_servicio = ?", [id]);
        return result;
    }
};

export default Servicio;