import Informe from "../models/informeModel.js"; // Importamos el modelo 'Informe'
import pool from "../config/db.js"; // Importamos el pool para consultas directas específicas

/**
 * Obtener todos los informes
 */
export const obtenerInformes = async (req, res) => {
    try {
        const informes = await Informe.findAll();
        res.json({ 
            success: true, 
            data: informes 
        });
    } catch (error) {
        console.error("Error al obtener informes:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Obtener un informe específico por su ID
 */
export const obtenerInformePorId = async (req, res) => {
    const { id } = req.params;
    try {
        // Consulta directa para buscar por ID_INFORMES
        const [rows] = await pool.query('SELECT * FROM informes WHERE ID_INFORMES = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Informe no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            data: rows[0] 
        });
    } catch (error) {
        console.error("Error al obtener informe por ID:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Crear un nuevo informe
 */
export const crearInforme = async (req, res) => {
    try {
        // Se recibe el cuerpo de la petición sin validaciones de sesión/token
        const nuevoInforme = await Informe.create(req.body);    
        res.json({ 
            success: true, 
            data: nuevoInforme 
        });
    } catch (error) {
        console.error("Error al crear informe:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Actualizar un informe existente
 */
export const actualizarInforme = async (req, res) => {
    const { id } = req.params;
    try {
        const informeActualizado = await Informe.update(id, req.body);  
        res.json({ 
            success: true, 
            data: informeActualizado 
        });
    } catch (error) {
        console.error("Error al actualizar informe:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }   
};

/**
 * Eliminar un informe
 */
export const eliminarInforme = async (req, res) => {
    const { id } = req.params;
    try {
        await Informe.delete(id);
        res.json({ 
            success: true, 
            message: 'Informe eliminado correctamente' 
        });
    } catch (error) {
        console.error("Error al eliminar informe:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};