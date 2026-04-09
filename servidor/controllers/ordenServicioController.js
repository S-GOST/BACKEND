import OrdenServicio from "../models/ordenServicioModel.js"; 
import pool from "../config/db.js"; 

// Obtener todas las órdenes de servicio
export const obtenerOrdenes = async (req, res) => {
    try {
        const filas = await OrdenServicio.findAll(); 
        res.json({ success: true, data: filas });
    } catch (error) {
        console.error("Error al obtener órdenes de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener una orden de servicio por su ID
export const obtenerOrdenPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear una nueva orden de servicio
export const crearOrden = async (req, res) => {
    try {
        const nuevaOrden = await OrdenServicio.create(req.body);    
        res.json({ success: true, data: nuevaOrden });
    } catch (error) {
        console.error("Error al crear orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar una orden de servicio existente
export const actualizarOrden = async (req, res) => {
    const id = req.params.id || req.body.ID_ORDEN_SERVICIO;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID_ORDEN_SERVICIO es requerido' });
    }

    try {
        const resultado = await OrdenServicio.update(id, req.body);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        res.json({ success: true, message: 'Orden de servicio actualizada correctamente' });
    } catch (error) {
        console.error("Error al actualizar orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar una orden de servicio
export const eliminarOrden = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID_ORDEN_SERVICIO es requerido' });
    }

    try {
        const resultado = await OrdenServicio.delete(id);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        res.json({ success: true, message: 'Orden de servicio eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
