import pool from "../config/db.js";

const Informe = {
    // Obtener todos los informes
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM informe");
        return rows;
    },

    // Buscar un informe por su ID (PK: ID_INFORME)
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM informe WHERE ID_INFORME = ?",
            [id]
        );
        if (!rows.length) return null;
        return rows[0];
    },

    // Crear un nuevo informe
    create: async (data) => {
        const { 
            ID_INFORME,
            ID_DETALLES_ORDEN_SERVICIO, 
            ID_ADMINISTRADOR, 
            ID_TECNICOS, 
            Descripcion, 
            Fecha, 
            Estado 
        } = data;
        
        const [result] = await pool.query(
            `INSERT INTO informe 
             (ID_INFORME, ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ID_INFORME, ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado]
        );

        return result;
    },

    // Actualizar un informe existente (no se modifica la clave primaria)
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
            `UPDATE informe
             SET ID_DETALLES_ORDEN_SERVICIO = ?,
                 ID_ADMINISTRADOR = ?,
                 ID_TECNICOS = ?,
                 Descripcion = ?,
                 Fecha = ?,
                 Estado = ?
             WHERE ID_INFORME = ?`,
            [ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado, id]
        );
        
        return result;
    },

    // Eliminar un informe
    delete: async (id) => {
        await pool.query("DELETE FROM informe WHERE ID_INFORME = ?", [id]);
        return true;
    },
};

export default Informe;