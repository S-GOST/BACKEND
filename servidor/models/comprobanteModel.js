import pool from "../config/db.js";

const Comprobante = {
    // Obtener todos los comprobantes
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM comprobante");
        return rows;
    },

    // Buscar un comprobante por su Clave Primaria (ID)
    findByPk: async (id) => {
        const [rows] = await pool.query("SELECT * FROM comprobante WHERE ID_COMPROBANTE = ?", [id]);
        return rows[0];
    },

    // Crear un nuevo comprobante
    create: async (datos) => {
        // Extraer los campos (ajusta los nombres según tu tabla de base de datos)
        const { ID_COMPROBANTE, Fecha, Valor_Total, ID_CLIENTE, ID_MOTOS, ID_SERVICIOS, Estado } = datos;
        
        const [result] = await pool.query(
            "INSERT INTO comprobante (ID_COMPROBANTE, Fecha, Valor_Total, ID_CLIENTE, ID_MOTOS, ID_SERVICIOS, Estado) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [ID_COMPROBANTE, Fecha, Valor_Total, ID_CLIENTE, ID_MOTOS, ID_SERVICIOS, Estado]
        );
        
        // Devolvemos el objeto creado
        return { 
            ID_COMPROBANTE: ID_COMPROBANTE || result.insertId, 
            Fecha, 
            Valor_Total, 
            ID_CLIENTE, 
            ID_MOTOS, 
            ID_SERVICIOS, 
            Estado 
        };
    },

    // Actualizar un comprobante existente
    update: async (id, datos) => {
        const { Fecha, Valor_Total, ID_CLIENTE, ID_MOTOS, ID_SERVICIOS, Estado } = datos;
        
        await pool.query(
            "UPDATE comprobante SET Fecha = ?, Valor_Total = ?, ID_CLIENTE = ?, ID_MOTOS = ?, ID_SERVICIOS = ?, Estado = ? WHERE ID_COMPROBANTE = ?",
            [Fecha, Valor_Total, ID_CLIENTE, ID_MOTOS, ID_SERVICIOS, Estado, id]
        );
        
        // Devolvemos el objeto actualizado
        return { ID_COMPROBANTE: id, Fecha, Valor_Total, ID_CLIENTE, ID_MOTOS, ID_SERVICIOS, Estado };
    },

    // Eliminar un comprobante
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM comprobante WHERE ID_COMPROBANTE = ?", [id]);
        return result;
    }
};

export default Comprobante;