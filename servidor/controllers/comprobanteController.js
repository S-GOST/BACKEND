import Comprobante from "../models/comprobanteModel.js"; // Importamos el modelo 'Comprobante'
import pool from "../config/db.js"; // Importamos el pool para consultas directas

/**
 * Obtener todos los comprobantes
 */
export const obtenerComprobantes = async (req, res) => {
    try {
        const comprobante = await Comprobante.findAll();
        res.json({ 
            success: true, 
            data: comprobante
        });
    } catch (error) {
        console.error("Error al obtener comprobante:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Obtener un comprobante específico por su ID
 */
export const obtenerComprobantePorId = async (req, res) => {
    const { id } = req.params;
    try {
        // Usamos query directa para buscar por el ID específico de la tabla comprobantes
        const [rows] = await pool.query('SELECT * FROM comprobante WHERE ID_COMPROBANTE = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Comprobante no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            data: rows[0] 
        });
    } catch (error) {
        console.error("Error al obtener comprobante por ID:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Crear un nuevo comprobante
 */
export const crearComprobante = async (req, res) => {
    try {
        // El modelo gestiona campos como Fecha, Monto, ID_CLIENTE, ID_MOTO, etc.
        const nuevoComprobante = await Comprobante.create(req.body);    
        res.json({ 
            success: true, 
            data: nuevoComprobante 
        });
    } catch (error) {
        console.error("Error al crear comprobante:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Actualizar un comprobante existente
 */
export const actualizarComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        const comprobanteActualizado = await Comprobante.update(id, req.body);  
        res.json({ 
            success: true, 
            data: comprobanteActualizado 
        });
    } catch (error) {
        console.error("Error al actualizar comprobante:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }   
};

/**
 * Eliminar un comprobante
 */
export const eliminarComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        await Comprobante.delete(id);
        res.json({ 
            success: true, 
            message: 'Comprobante eliminado correctamente' 
        });
    } catch (error) {
        console.error("Error al eliminar comprobante:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};