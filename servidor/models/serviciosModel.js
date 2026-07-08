import pool from "../config/db.js";

const Servicio = {
    // Obtener todos los servicios (con JOIN a categorias)
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT s.*, c.nombre AS categoria_nombre 
             FROM servicios s 
             LEFT JOIN categorias c ON s.ID_CATEGORIA = c.ID_CATEGORIA`
        );
        return rows;
    },

    // Buscar un servicio por su Clave Primaria (ID)
    findByPk: async (id) => {
        const [rows] = await pool.query(
            `SELECT s.*, c.nombre AS categoria_nombre 
             FROM servicios s 
             LEFT JOIN categorias c ON s.ID_CATEGORIA = c.ID_CATEGORIA 
             WHERE s.ID_SERVICIOS = ?`,
            [id]
        );
        return rows[0];
    },

    // Buscar servicios por categoría
    findByCategoria: async (idCategoria) => {
        const [rows] = await pool.query(
            `SELECT s.*, c.nombre AS categoria_nombre 
             FROM servicios s 
             LEFT JOIN categorias c ON s.ID_CATEGORIA = c.ID_CATEGORIA 
             WHERE s.ID_CATEGORIA = ?`,
            [idCategoria]
        );
        return rows;
    },

    // Crear un nuevo registro
    create: async (datos) => {
        const { ID_SERVICIOS, ID_CATEGORIA, Nombre, Precio, Estado } = datos;
        const [result] = await pool.query(
            "INSERT INTO servicios (ID_SERVICIOS, ID_CATEGORIA, Nombre, Precio, Estado) VALUES (?, ?, ?, ?, ?)",
            [ID_SERVICIOS, ID_CATEGORIA, Nombre, Precio, Estado]
        );
        return { ID_SERVICIOS: result.insertId, ID_CATEGORIA, Nombre, Precio, Estado };
    },

    // Actualizar un registro existente
    update: async (id, datos) => {
        const { ID_SERVICIOS, ID_CATEGORIA, Nombre, Precio, Estado } = datos;
        await pool.query(
            "UPDATE servicios SET ID_SERVICIOS = ?, ID_CATEGORIA = ?, Nombre = ?, Precio = ?, Estado = ? WHERE ID_SERVICIOS = ?",
            [ID_SERVICIOS, ID_CATEGORIA, Nombre, Precio, Estado, id]
        );
        return { ID_SERVICIOS: id, ID_CATEGORIA, Nombre, Precio, Estado };
    },

    // Eliminar un registro
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM servicios WHERE ID_SERVICIOS = ?", [id]);
        return result;
    }
};

export default Servicio;