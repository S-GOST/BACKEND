import Moto from "../models/motosModel.js"; // Importamos el modelo 'Moto'
import pool from "../config/db.js"; // Importamos el pool para consultas directas específicas

/**
 * Obtener todas las motos
 */
export const obtenerMotos = async (req, res) => {
    try {
        const motos = await Moto.findAll();
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
        // Usamos query directa para buscar por el ID específico de la tabla motos
        const [rows] = await pool.query('SELECT * FROM motos WHERE ID_MOTOS = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Moto no encontrada' 
            });
        }

        res.json({ 
            success: true, 
            data: rows[0] 
        });
    } catch (error) {
        console.error("Error al obtener moto por ID:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Crear una nueva moto
 */
export const crearMoto = async (req, res) => {
    try {
        // El modelo 'Moto' gestiona la inserción (placa, modelo, marca, etc.)
        const nuevaMoto = await Moto.create(req.body);    
        res.json({ 
            success: true, 
            data: nuevaMoto 
        });
    } catch (error) {
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
        res.json({ 
            success: true, 
            data: motoActualizada 
        });
    } catch (error) {
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
        res.json({ 
            success: true, 
            message: 'Moto eliminada correctamente' 
        });
    } catch (error) {
        console.error("Error al eliminar moto:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};