import pool from "../config/db.js";

const Servicio = {
    // Obtener todos los servicios
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM servicios");
        return rows;
    },

    // Buscar un servicio por su Clave Primaria (ID)
    findByPk: async (id) => {
        const [rows] = await pool.query("SELECT * FROM servicios WHERE ID_SERVICIOS = ?", [id]);
        return rows[0];
    },

    // Crear un nuevo registro
    create: async (datos) => {
        // Extraer los campos con los nombres que envía el frontend (mayúsculas)
        const { ID_SERVICIOS, Nombre, Categoria, Garantia, Estado, Precio } = datos;
        const [result] = await pool.query(
            "INSERT INTO servicios (ID_SERVICIOS, Nombre, Categoria, Garantia, Estado, Precio) VALUES (?, ?, ?, ?, ?, ?)",
            [ID_SERVICIOS, Nombre, Categoria, Garantia, Estado, Precio]
        );
        // Devolvemos el objeto creado con las mismas claves (mayúsculas)
        return { ID_SERVICIOS: result.insertId, Nombre, Categoria, Garantia, Estado, Precio };
    },

    // Actualizar un registro existente
    update: async (id, datos) => {
        // Extraer los campos con los nombres del frontend
        const {ID_SERVICIOS , Nombre, Categoria, Garantia, Estado, Precio } = datos;
        await pool.query(
            "UPDATE servicios SET ID_SERVICIOS= ?, Nombre = ?, Categoria = ?, Garantia = ?, Estado = ?, Precio = ? WHERE ID_SERVICIOS = ?",
            [ID_SERVICIOS, Nombre, Categoria, Garantia, Estado, Precio, id]
        );
        // Devolvemos el objeto actualizado
        return { ID_SERVICIOS: id, Nombre, Categoria, Garantia, Estado, Precio };
    },

    // Eliminar un registro
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM servicios WHERE ID_SERVICIOS = ?", [id]);
        return result;
    }
};

export default Servicio;