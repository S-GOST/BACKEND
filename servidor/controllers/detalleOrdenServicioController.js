import DetalleOrdenServicio from "../models/detalleOrdenServicioModel.js";

// 1. Obtener TODOS los detalles
export const obtenerDetallesOrden = async (req, res) => {
  try {
    const filas = await DetalleOrdenServicio.findAll();
    res.json({ success: true, data: filas });
  } catch (error) {
    console.error("Error al obtener detalles:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Obtener UN SOLO detalle por su ID
export const obtenerDetalleOrdenPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const detalle = await DetalleOrdenServicio.findById(id);

    if (!detalle || detalle.length === 0) {
      return res.status(404).json({ success: false, message: 'Detalle no encontrado' });
    }

    res.json({ success: true, data: detalle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Obtener detalles filtrando por ID de la Orden
export const obtenerDetallesPorId = async (req, res) => {
  try {
    const { idOrden, id } = req.params;
    const idBusqueda = idOrden || id;

    if (!idBusqueda) {
      return res.status(400).json({ success: false, message: 'Falta el ID para buscar' });
    }

    const detalles = await DetalleOrdenServicio.findByOrderId(idBusqueda);
    res.json({ success: true, data: detalles });
  } catch (error) {
    console.error("Error en obtenerDetallesPorId:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// 4. Crear un nuevo detalle (CORREGIDO: Sanea campos opcionales)
export const crearDetalleOrden = async (req, res) => {
  try {
    // ✅ SANEAMIENTO: Asegurar que los campos relacionales sean null si no existen
    const body = { ...req.body };
    if (!body.ID_SERVICIOS || body.ID_SERVICIOS === "") body.ID_SERVICIOS = null;
    if (!body.ID_PRODUCTOS || body.ID_PRODUCTOS === "") body.ID_PRODUCTOS = null;
    if (!body.NombreServicio) body.NombreServicio = null;
    if (!body.NombreProducto) body.NombreProducto = null;
    if (body.Precio === undefined || body.Precio === null) body.Precio = 0;
    if (body.Garantia === undefined || body.Garantia === null) body.Garantia = 0;

    const nuevoDetalle = await DetalleOrdenServicio.create(body);
    res.json({ success: true, data: nuevoDetalle });
  } catch (error) {
    console.error("Error al crear detalle:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Actualizar un detalle
export const actualizarDetalleOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const idActual = id || req.body.ID_DETALLES_ORDEN_SERVICIO;

    if (!idActual) {
      return res.status(400).json({ success: false, message: 'El ID del detalle es requerido' });
    }

    const { ID_DETALLES_ORDEN_SERVICIO, ...datosParaActualizar } = req.body;
    const resultado = await DetalleOrdenServicio.update(idActual, datosParaActualizar);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Detalle no encontrado' });
    }

    res.json({ success: true, message: 'Detalle actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Eliminar un detalle
export const eliminarDetalleOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const idEliminar = id || req.body.ID_DETALLES_ORDEN_SERVICIO;

    if (!idEliminar) {
      return res.status(400).json({ success: false, message: 'ID requerido para eliminar' });
    }

    const eliminados = await DetalleOrdenServicio.delete(idEliminar);

    if (eliminados.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Detalle no encontrado' });
    }

    res.json({ success: true, message: 'Detalle eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};