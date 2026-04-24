import pool from "../config/db.js";

const Comprobante = {
    // Obtener todos los comprobantes
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM comprobante");
        return rows;
    },

    // Buscar un comprobante por su clave primaria (ID_COMPROBANTE)
    findByPk: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM comprobante WHERE ID_COMPROBANTE = ?",
            [id]
        );
        return rows[0];
    },

    // Crear un nuevo comprobante
    create: async (datos) => {
        const {
            ID_COMPROBANTE,
            ID_INFORME,
            ID_CLIENTES,
            ID_ADMINISTRADOR,
            Monto,
            Fecha,
            Estado_pago,
        } = datos;

        const [result] = await pool.query(
            `INSERT INTO comprobante
             (ID_COMPROBANTE, ID_INFORME, ID_CLIENTES, ID_ADMINISTRADOR, Monto, Fecha, Estado_pago)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                ID_COMPROBANTE,
                ID_INFORME || null,
                ID_CLIENTES,
                ID_ADMINISTRADOR || null,
                Monto,
                Fecha || new Date(),  // si no se envía, usa fecha actual
                Estado_pago || 'Pendiente',
            ]
        );

        // Retornar el comprobante creado (similar a cómo lo espera el controlador)
        return {
            ID_COMPROBANTE: ID_COMPROBANTE || result.insertId,
            ID_INFORME,
            ID_CLIENTES,
            ID_ADMINISTRADOR,
            Monto,
            Fecha,
            Estado_pago,
        };
    },

    // Actualizar un comprobante existente
    update: async (id, datos) => {
        const {
            ID_INFORME,
            ID_CLIENTES,
            ID_ADMINISTRADOR,
            Monto,
            Fecha,
            Estado_pago,
        } = datos;

        const [result] = await pool.query(
            `UPDATE comprobante
             SET ID_INFORME = ?,
                 ID_CLIENTES = ?,
                 ID_ADMINISTRADOR = ?,
                 Monto = ?,
                 Fecha = ?,
                 Estado_pago = ?
             WHERE ID_COMPROBANTE = ?`,
            [
                ID_INFORME || null,
                ID_CLIENTES,
                ID_ADMINISTRADOR || null,
                Monto,
                Fecha,
                Estado_pago,
                id,   // el ID del comprobante a actualizar
            ]
        );

        return {
            ID_COMPROBANTE: id,
            ID_INFORME,
            ID_CLIENTES,
            ID_ADMINISTRADOR,
            Monto,
            Fecha,
            Estado_pago,
        };
    },

    // Eliminar un comprobante
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM comprobante WHERE ID_COMPROBANTE = ?",
            [id]
        );
        return result;
    },
};

export default Comprobante;