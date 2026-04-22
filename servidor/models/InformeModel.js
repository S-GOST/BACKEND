import pool from "../config/db.js";

const Informe = {
    // Obtener todos los informes
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM informe");
        return rows;
    },

    // Buscar un informe por su ID (PK)
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM informe WHERE ID_INFORMES = ?",
            [id]
        );
        if (!rows.length) return null;
        return rows[0];
    },

    // Crear un nuevo informe
    create: async (data) => {
        const { ID_INFORMES, ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo_Total } = data;
        
        const [result] = await pool.query(
            `INSERT INTO informe (ID_INFORMES, ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo_Total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ID_INFORMES, ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo_Total]
        );

        // Devolvemos el resultado de la inserción
        return result;
    },

    // Actualizar un informe existente
    update: async (id, data) => {
        const { ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo_Total } = data;
        
        const [result] = await pool.query(
            `UPDATE informes
             SET ID_MOTOS = ?, Fecha = ?, Descripcion = ?, Diagnostico = ?, Costo_Total = ?
             WHERE ID_INFORMES = ?`,
            [ID_MOTOS, Fecha, Descripcion, Diagnostico, Costo_Total, id]
        );
        
        return result;
    },

    // Eliminar un informe
    delete: async (id) => {
        await pool.query("DELETE FROM informes WHERE ID_INFORMES = ?", [id]);
        return true;
    },
};

export default Informe;