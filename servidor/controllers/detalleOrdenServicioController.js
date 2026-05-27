import DetalleOrdenServicio from "../models/detalleOrdenServicioModel.js";

export const obtenerDetallesOrden = async (req, res) => {
  try {
    const filas = await DetalleOrdenServicio.findAll();
    res.json({ success: true, data: filas });
  } catch (error) {
    console.error("Error al obtener detalles de orden de servicio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerDetalleOrdenPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const detalle = await DetalleOrdenServicio.findByPk(id);

    if (!detalle) {
      return res.status(404).json({ success: false, message: 'Detalle de orden de servicio no encontrado' });
    }

    res.json({ success: true, data: detalle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerDetallesPorId = async (req, res) => {
    try {
        const { idOrden } = req.params;

        // Consulta SQL para obtener los detalles de una orden específica
        const query = "SELECT * FROM detalles_orden_servicio WHERE ID_ORDEN_SERVICIO = ?";
        const [rows] = await pool.execute(query, [idOrden]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const crearDetalleOrden = async (req, res) => {
  try {
    const nuevoDetalle = await DetalleOrdenServicio.create(req.body);
    res.json({ success: true, data: nuevoDetalle });
  } catch (error) {
    console.error("Error al crear detalle de orden de servicio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const actualizarDetalleOrden = async (req, res) => {
  const id = req.params.id || req.body.ID_DETALLES_ORDEN_SERVICIO;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID_DETALLES_ORDEN_SERVICIO es requerido' });
  }

  try {
    const resultado = await DetalleOrdenServicio.update(id, req.body);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Detalle de orden de servicio no encontrado' });
    }

    res.json({ success: true, message: 'Detalle de orden de servicio actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar detalle de orden de servicio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const eliminarDetalleOrden = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID_DETALLES_ORDEN_SERVICIO es requerido' });
  }

  try {
    const resultado = await DetalleOrdenServicio.delete(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Detalle de orden de servicio no encontrado' });
    }

    res.json({ success: true, message: 'Detalle de orden de servicio eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar detalle de orden de servicio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};