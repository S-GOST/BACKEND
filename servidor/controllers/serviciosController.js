import Servicio from "../models/serviciosModel.js";
import { logHistory } from "../utils/historyLogger.js";

/**
 * Obtener todos los servicios
 */
export const obtenerServicios = async (req, res) => {
    try {
        const servicios = await Servicio.findAll();
        res.json({
            success: true,
            data: servicios
        });
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Obtener un servicio específico por su ID
 */
export const obtenerServicioPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const servicio = await Servicio.findByPk(id);

        if (!servicio) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }

        res.json({ success: true, data: servicio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Crear un nuevo servicio
 */
export const crearServicio = async (req, res) => {
    try {
        const nuevoServicio = await Servicio.create(req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'servicios',
            nuevoServicio.ID_SERVICIOS || 0, // Prisma devuelve el ID_SERVICIOS creado
            'INSERT',
            `Se creó el servicio ${req.body.Nombre || req.body.nombre || 'N/A'}`
        );

        res.json({
            success: true,
            data: nuevoServicio
        });
    } catch (error) {
        if (error.code === 'P2002') { // Violación de Unique Constraint en Prisma
            return res.status(400).json({ success: false, message: 'El nombre del servicio ya existe' });
        }
        console.error("Error al crear servicio:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Actualizar un servicio existente
 */
export const actualizarServicio = async (req, res) => {
    const { id } = req.params;
    try {
        const servicioActualizado = await Servicio.update(id, req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'servicios',
            id,
            'UPDATE',
            `Se actualizó el servicio ID ${id}`
        );

        res.json({
            success: true,
            data: servicioActualizado
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El nombre del servicio ya existe' });
        }
        if (error.code === 'P2025') { // Registro no encontrado
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        console.error("Error al actualizar servicio:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Eliminar un servicio
 */
export const eliminarServicio = async (req, res) => {
    const { id } = req.params;
    try {
        await Servicio.delete(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'servicios',
            id,
            'DELETE',
            `Se eliminó el servicio ID ${id}`
        );

        res.json({
            success: true,
            message: 'Servicio eliminado correctamente'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        console.error("Error al eliminar servicio:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Habilitar (restaurar) un servicio
 */
export const habilitarServicio = async (req, res) => {
    const { id } = req.params;
    try {
        await Servicio.restore(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'servicios',
            id,
            'UPDATE',
            `Se habilitó el servicio ID ${id}`
        );

        res.json({ success: true, message: "Servicio habilitado correctamente" });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        console.error("Error al habilitar servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
