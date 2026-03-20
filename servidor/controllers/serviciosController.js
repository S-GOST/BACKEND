import Servicio from "../models/servicioModel.js"; // Importamos el modelo 'Servicio'
import pool from "../config/db.js"; // Importamos el pool de conexiones por si se requieren consultas personalizadas

/**
 * Obtener todos los servicios
 */
export const obtenerServicios = async (req, res) => {
    try {
        const servicios = await Servicio.findAll();
        // Mantenemos la estructura res.json({ success: true, data: [...] })
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
            return res.status(404).json({ 
                success: false, 
                message: 'Servicio no encontrado' 
            });
        }
        res.json({ 
            success: true, 
            data: servicio 
        });
    } catch (error) {
        console.error("Error al obtener el servicio:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Crear un nuevo servicio
 */
export const crearServicio = async (req, res) => {
    try {
        // El modelo 'Servicio' debe gestionar la inserción de los campos (nombre, precio, etc.)
        const nuevoServicio = await Servicio.create(req.body);    
        res.json({ 
            success: true, 
            data: nuevoServicio 
        });
    } catch (error) {
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
        res.json({ 
            success: true, 
            data: servicioActualizado 
        });
    } catch (error) {
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
        res.json({ 
            success: true, 
            message: 'Servicio eliminado correctamente' 
        });
    } catch (error) {
        console.error("Error al eliminar servicio:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};