import pool from "../config/db.js";

const Informe = {
    // Obtener todos los informes
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM informe");
        return rows;
    },

    // Buscar un informe por su ID (PK: id_informe)
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM informe WHERE id_informe = ?",
            [id]
        );
        if (!rows.length) return null;
        return rows[0];
    },

    // Crear un nuevo informe
    create: async (data) => {
        const { 
            id_orden, 
            id_tecnico, 
            diagnostico, 
            trabajo_realizado, 
            recomendaciones
        } = data;
        
        const [result] = await pool.query(
            `INSERT INTO informe 
             (id_orden, id_tecnico, diagnostico, trabajo_realizado, recomendaciones)
             VALUES (?, ?, ?, ?, ?)`,
            [id_orden, id_tecnico, diagnostico, trabajo_realizado, recomendaciones]
        );

        return result;
    },

    // Actualizar un informe existente
    update: async (id, data) => {
        const { 
            id_orden, 
            id_tecnico, 
            diagnostico, 
            trabajo_realizado, 
            recomendaciones
        } = data;
        
        const [result] = await pool.query(
            `UPDATE informe
             SET id_orden = ?,
                 id_tecnico = ?,
                 diagnostico = ?,
                 trabajo_realizado = ?,
                 recomendaciones = ?
             WHERE id_informe = ?`,
            [id_orden, id_tecnico, diagnostico, trabajo_realizado, recomendaciones, id]
        );
        
        return result;
    },

    // Eliminar un informe
    delete: async (id) => {
        await pool.query("DELETE FROM informe WHERE id_informe = ?", [id]);
        return true;
    },
};

export default Informe;