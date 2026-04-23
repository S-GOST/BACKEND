import Informe from "../models/informeModel.js"; 
import pool from "../config/db.js"; 

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
 * Se cambió ID_INFORMES por ID_INFORME según la imagen
 */
export const obtenerInformePorId = async (req, res) => {
    const { id } = req.params;
    try {
        // Ajustado al nombre exacto de la columna en tu base de datos
        const [rows] = await pool.query('SELECT * FROM informes WHERE ID_INFORME = ?', [id]);

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
 * Asegúrate de enviar estos campos en el JSON:
 * ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS, Descripcion, Fecha, Estado
 */
export const crearInforme = async (req, res) => {
    try {
        const { 
            ID_DETALLES_ORDEN_SERVICIO, 
            ID_ADMINISTRADOR, 
            ID_TECNICOS, 
            Descripcion, 
            Fecha, 
            Estado 
        } = req.body;

        const nuevoInforme = await Informe.create({
            ID_DETALLES_ORDEN_SERVICIO,
            ID_ADMINISTRADOR,
            ID_TECNICOS,
            Descripcion,
            Fecha,
            Estado
        });    

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
        // Pasamos el ID y el cuerpo con los nombres de columnas correctos
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