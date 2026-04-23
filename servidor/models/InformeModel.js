import pool from "../config/db.js";

const Informe = {
    // Obtener todos los informes
    findAll: async () => {
        // Ajustado a la tabla 'informes' según el estándar de los otros métodos
        const [rows] = await pool.query("SELECT * FROM informes");
        return rows;
    },

    // Buscar un informe por su ID (PK: ID_INFORME)
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM informes WHERE ID_INFORME = ?",
            [id]
        );
        if (!rows.length) return null;
        return rows[0];
    },

    // Crear un nuevo informe con los atributos de la foto
    create: async (data) => {
        const { 
            ID_DETALLES_ORDEN_SERVICIO, 
            ID_ADMINISTRADOR, 
            ID_TECNICOS, 
            Descripcion, 
            Fecha, 
            Estado 
        } = data;
        
        const [result] = await pool.query(
            `INSERT INTO informes (ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado]
        );

        return result;
    },

    // Actualizar un informe existente
    update: async (id, data) => {
        const { 
            ID_DETALLES_ORDEN_SERVICIO, 
            ID_ADMINISTRADOR, 
            ID_TECNICOS, 
            Descripcion, 
            Fecha, 
            Estado 
        } = data;
        
        const [result] = await pool.query(
            `UPDATE informes
             SET ID_DETALLES_ORDEN_SERVICIO = ?, ID_ADMINISTRADOR = ?, ID_TECNICOS = ?, Descripcion = ?, Fecha = ?, Estado = ?
             WHERE ID_INFORME = ?`,
            [ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado, id]
        );
        
        return result;
    },

    // Eliminar un informe usando la PK correcta
    delete: async (id) => {
        await pool.query("DELETE FROM informes WHERE ID_INFORME = ?", [id]);
        return true;
    },
};

export default Informe;