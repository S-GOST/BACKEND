import Comprobante from "../models/comprobanteModel.js";
import { logHistory } from "../utils/historyLogger.js";

export const obtenerComprobantes = async (req, res) => {
    try {
        const comprobantes = await Comprobante.findAll();
        res.json({ success: true, data: comprobantes });
    } catch (error) {
        console.error("Error al obtener comprobantes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerComprobantePorId = async (req, res) => {
    const { id } = req.params;
    try {
        const comprobante = await Comprobante.findByPk(id);
        if (!comprobante) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }
        res.json({ success: true, data: comprobante });
    } catch (error) {
        console.error("Error al obtener comprobante por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearComprobante = async (req, res) => {
    try {
        const nuevoComprobante = await Comprobante.create(req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            nuevoComprobante.insertId || 0,
            'INSERT',
            `Se creó un comprobante`
        );

        res.json({ success: true, data: nuevoComprobante });
    } catch (error) {
        console.error("Error al crear comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        const comprobanteActualizado = await Comprobante.update(id, req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            id,
            'UPDATE',
            `Se actualizó el comprobante ID ${id}`
        );

        res.json({ success: true, data: comprobanteActualizado });
    } catch (error) {
        console.error("Error al actualizar comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const eliminarComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        await Comprobante.delete(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            id,
            'DELETE',
            `Se eliminó el comprobante ID ${id}`
        );

        res.json({ success: true, message: 'Comprobante eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};