import Historial from "../models/historialModel.js";

/**
 * Obtener todo el historial
 */
export const obtenerHistorial = async (req, res) => {
    try {
        const historial = await Historial.findAll();
        res.json({ 
            success: true, 
            data: historial 
        });
    } catch (error) {
        console.error("Error al obtener el historial:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Obtener un registro de historial específico por su ID
 */
export const obtenerHistorialPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const registro = await Historial.findById(id);
        if (!registro) {
            return res.status(404).json({ 
                success: false, 
                message: 'Registro de historial no encontrado' 
            });
        }
        res.json({ 
            success: true, 
            data: registro 
        });
    } catch (error) {
        console.error("Error al obtener historial por ID:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Crear un nuevo registro en el historial
 */
export const crearHistorial = async (req, res) => {
    try {
        const nuevoRegistro = await Historial.create(req.body);    
        res.json({ 
            success: true, 
            data: nuevoRegistro 
        });
    } catch (error) {
        console.error("Error al crear registro en historial:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Actualizar un registro de historial existente
 */
export const actualizarHistorial = async (req, res) => {
    const { id } = req.params;
    try {
        const registroActualizado = await Historial.update(id, req.body);  
        res.json({ 
            success: true, 
            data: registroActualizado 
        });
    } catch (error) {
        console.error("Error al actualizar historial:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }   
};

/**
 * Eliminar un registro del historial
 */
export const eliminarHistorial = async (req, res) => {
    const { id } = req.params;
    try {
        await Historial.delete(id);
        res.json({ 
            success: true, 
            message: 'Registro de historial eliminado correctamente' 
        });
    } catch (error) {
        console.error("Error al eliminar historial:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};