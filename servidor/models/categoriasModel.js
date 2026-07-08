import pool from "../config/db.js";

const Categoria = {
    // Obtener todas las categorías
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM categorias");
        return rows;
    },

    // Buscar una categoría por su ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM categorias WHERE ID_CATEGORIA = ?",
            [id]
        );
        return rows[0];
    },

    // Buscar categorías por tipo (PRODUCTO o SERVICIO)
    findByTipo: async (tipo) => {
        const [rows] = await pool.query(
            "SELECT * FROM categorias WHERE tipo = ?",
            [tipo]
        );
        return rows;
    },

    // Crear una nueva categoría
    create: async (data) => {
        const { nombre, tipo, descripcion } = data;
        const [result] = await pool.query(
            `INSERT INTO categorias (nombre, tipo, descripcion) VALUES (?, ?, ?)`,
            [nombre, tipo, descripcion]
        );
        return { ID_CATEGORIA: result.insertId, nombre, tipo, descripcion };
    },

    // Actualizar una categoría existente
    update: async (id, data) => {
        const { nombre, tipo, descripcion } = data;
        const [result] = await pool.query(
            `UPDATE categorias 
             SET nombre = ?, tipo = ?, descripcion = ?
             WHERE ID_CATEGORIA = ?`,
            [nombre, tipo, descripcion, id]
        );
        return result;
    },

    // Eliminar una categoría
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM categorias WHERE ID_CATEGORIA = ?",
            [id]
        );
        return result;
    },
};

export default Categoria;
