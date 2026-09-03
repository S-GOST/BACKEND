import Moto from "../models/motosModel.js";
import Usuario from "../models/usuarioModel.js";
import { logHistory } from "../utils/historyLogger.js";

/**
 * Obtener todas las motos
 */
export const obtenerMotos = async (req, res) => {
    try {
        let motos = await Moto.findAll();
        // Si el usuario es un cliente (rol 3), solo mostramos sus motos
        if (req.user && req.user.id_rol === 3) {
            motos = motos.filter(moto => moto.id_cliente === req.user.id_usuario);
        }
        res.json({
            success: true,
            data: motos
        });
    } catch (error) {
        console.error("Error al obtener motos:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Obtener una moto específica por su ID
 */
export const obtenerMotoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const motos = await Moto.findById(id);
        if (!motos) {
            return res.status(404).json({ success: false, message: "Moto no encontrada" });
        }
        res.json({ success: true, data: motos });
    } catch (error) {
        console.error("Error al obtener moto por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Crear una nueva moto
 */
export const crearMoto = async (req, res) => {
    try {
        const idCliente = req.body.id_cliente || req.body.ID_CLIENTES || req.body.ID_CLIENTE;
        if (idCliente) {
            // FindByPk busca por numero_documento si le pasas eso, pero el controlador
            // está asumiendo que idCliente podría ser el id_usuario o el documento.
            // Para mantener compatibilidad, Prisma devolverá el usuario.
            let cliente = await Usuario.findOne({ where: { id_usuario: Number(idCliente) } });
            if (!cliente) {
                cliente = await Usuario.findByPk(idCliente);
            }

            if (cliente && cliente.id_usuario) {
                req.body.id_cliente = cliente.id_usuario;
                req.body.ID_CLIENTES = cliente.id_usuario;
            }

            if (!cliente || cliente.id_rol !== 3 || (cliente.estado !== 'Activo' && cliente.estado !== 'Pendiente')) {
                return res.status(400).json({ success: false, message: 'El cliente asociado no existe o no está activo' });
            }
        }

        const nuevaMoto = await Moto.create(req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'motos',
            nuevaMoto.id_moto || 0, // Prisma devuelve directamente el id_moto
            'INSERT',
            `Se creó una nueva moto (placa: ${req.body.placa || req.body.Placa || 'N/A'})`
        );

        res.json({
            success: true,
            data: nuevaMoto
        });
    } catch (error) {
        // En Prisma P2002 = Duplicado
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'La placa de la moto ya se encuentra registrada' });
        }
        console.error("Error al crear moto:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Actualizar una moto existente
 */
export const actualizarMoto = async (req, res) => {
    const { id } = req.params;
    try {
        const motoActualizada = await Moto.update(id, req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'motos',
            id,
            'UPDATE',
            `Se actualizó la moto ID ${id}`
        );

        res.json({
            success: true,
            data: motoActualizada
        });
    } catch (error) {
        // En Prisma P2002 = Duplicado
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'La placa de la moto ya se encuentra registrada por otra moto' });
        }
        console.error("Error al actualizar moto:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Eliminar una moto
 */
export const eliminarMoto = async (req, res) => {
    const { id } = req.params;
    try {
        await Moto.delete(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'motos',
            id,
            'DELETE',
            `Se eliminó la moto ID ${id}`
        );

        res.json({
            success: true,
            message: 'Moto eliminada correctamente'
        });
    } catch (error) {
        // En Prisma P2003 = Foreign Key Constraint Failed (Está siendo referenciada en otra tabla)
        if (error.code === 'P2003') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar la moto porque tiene órdenes de servicio asociadas. Debe ser inhabilitada.' });
        }
        console.error("Error al eliminar moto:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
