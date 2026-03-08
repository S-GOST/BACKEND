import Administrador from "../models/adminModel.js";

export const obtenerAdmins = async (req, res) => {
    try {
        const admins = await Administrador.findAll();
        res.json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerAdminPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await Administrador.findById(id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Administrador no encontrado"
            });
        }

        res.json({
            success: true,
            data: admin
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const crearAdmin = async (req, res) => {
    try {
        await Administrador.create(req.body);
        res.status(201).json({
            success: true,
            message: "Administrador creado exitosamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const existe = await Administrador.findById(id);
        if (!existe) {
            return res.status(404).json({
                success: false,
                message: "Administrador no encontrado"
            });
        }

        await Administrador.update(id, req.body);

        res.json({
            success: true,
            message: "Administrador actualizado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const eliminarAdmin = async (req, res) => {
    try {
        await Administrador.delete(req.params.id);
        res.json({ success: true, message: "Administrador eliminado" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};