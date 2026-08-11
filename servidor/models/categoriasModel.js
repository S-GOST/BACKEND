import pool from "../config/db.js";

const Categoria = {
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

    // Eliminar (Inhabilitar) una categoría
    delete: async (id) => {
        const [result] = await pool.query(
            "UPDATE categorias SET estado = 'Inactivo' WHERE ID_CATEGORIA = ?",
            [id]
        );
        return result;
    },

    // Restaurar (Habilitar) una categoría
    restore: async (id) => {
        const [result] = await pool.query(
            "UPDATE categorias SET estado = 'Activo' WHERE ID_CATEGORIA = ?",
            [id]
        );
        return result;
    },

    // Verificar dependencias
    checkDependencies: async (id) => {
        const [productos] = await pool.query("SELECT COUNT(*) AS count FROM productos WHERE ID_CATEGORIA = ? AND Estado = 'Activo'", [id]);
        const [servicios] = await pool.query("SELECT COUNT(*) AS count FROM servicios WHERE ID_CATEGORIA = ? AND Estado = 'Activo'", [id]);
        return {
            productosCount: productos[0].count,
            serviciosCount: servicios[0].count
        };
    },
};

export default Categoria;
