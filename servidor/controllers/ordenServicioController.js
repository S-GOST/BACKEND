import OrdenServicio from "../models/ordenServicioModel.js";

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
        const orden = await OrdenServicio.findById(id);
        if (!orden) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }
        res.json({ success: true, data: orden });
    } catch (error) {
        console.error("Error al obtener orden por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear una nueva orden de servicio
export const crearOrden = async (req, res) => {
    try {
        const resultado = await OrdenServicio.create(req.body);
        // Recuperamos la orden recién insertada para devolverla completa
        const ordenCreada = await OrdenServicio.findById(req.body.ID_ORDEN_SERVICIO);
        res.status(201).json({ success: true, data: ordenCreada, insertResult: resultado });
    } catch (error) {
        console.error("Error al crear orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar una orden de servicio existente
export const actualizarOrden = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID_ORDEN_SERVICIO es requerido' });
    }
    try {
        // Verificar existencia
        const existe = await OrdenServicio.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }
        await OrdenServicio.update(id, req.body);
        const ordenActualizada = await OrdenServicio.findById(id);
        res.json({ success: true, data: ordenActualizada });
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
        const existe = await OrdenServicio.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }
        await OrdenServicio.delete(id);
        res.json({ success: true, message: 'Orden de servicio eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};