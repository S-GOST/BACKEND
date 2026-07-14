import Historial from '../models/historialModel.js';

/**
 * Registra una acción en la tabla de historial.
 * @param {number} id_usuario - ID del usuario que realiza la acción (por defecto 1 si no se provee)
 * @param {string} tabla_afectada - Nombre de la tabla ('usuarios', 'clientes', 'motos', etc.)
 * @param {number|string} id_registro - El ID del registro insertado/modificado/eliminado
 * @param {string} accion - 'INSERT', 'UPDATE', 'DELETE'
 * @param {string} descripcion - Descripción opcional (ej: 'Se creó un nuevo técnico')
 */
export const logHistory = async (id_usuario, tabla_afectada, id_registro, accion, descripcion) => {
    try {
        await Historial.create({
            id_usuario: id_usuario || 1, // Fallback al admin 1 si no hay usuario en contexto
            tabla_afectada,
            id_registro,
            accion,
            descripcion
        });
    } catch (error) {
        console.error(`Error al registrar historial en ${tabla_afectada}:`, error.message);
    }
};
