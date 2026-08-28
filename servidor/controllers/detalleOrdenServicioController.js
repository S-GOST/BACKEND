import DetalleOrdenServicio from "../models/detalleOrdenServicioModel.js";
import { logHistory } from "../utils/historyLogger.js";
import pool from "../config/db.js";

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

import Servicio from "../models/serviciosModel.js";
import Producto from "../models/productosModel.js";

// 4. Crear un nuevo detalle (CORREGIDO: Sanea campos opcionales y toma precio del catálogo)
export const crearDetalleOrden = async (req, res) => {
  try {
    // ✅ SANEAMIENTO: Asegurar que los campos relacionales sean null si no existen
    const body = { ...req.body };
    if (body.ID_SERVICIOS === undefined || body.ID_SERVICIOS === null || body.ID_SERVICIOS === "") body.ID_SERVICIOS = null;
    if (body.ID_PRODUCTOS === undefined || body.ID_PRODUCTOS === null || body.ID_PRODUCTOS === "") body.ID_PRODUCTOS = null;

    let precioUnitario = 0;
    
    // CA-010: RN-0010 Los precios se toman del catálogo al momento de crear el detalle
    const cantidad = body.cantidad || 1;

    if (body.ID_SERVICIOS) {
        const servicio = await Servicio.findById(body.ID_SERVICIOS);
        if (!servicio) {
            return res.status(400).json({ success: false, message: `El servicio con ID ${body.ID_SERVICIOS} no existe` });
        }
        precioUnitario = parseFloat(servicio.Precio || 0);
    } else if (body.ID_PRODUCTOS) {
        const producto = await Producto.findById(body.ID_PRODUCTOS);
        if (!producto) {
            return res.status(400).json({ success: false, message: `El producto con ID ${body.ID_PRODUCTOS} no existe` });
        }
        // RN-008: Verificar stock
        if (producto.stock < cantidad) {
            return res.status(400).json({ success: false, message: `Stock insuficiente para el producto ${producto.Nombre}. Stock actual: ${producto.stock}` });
        }
        precioUnitario = parseFloat(producto.precio_venta ?? producto.Precio ?? 0);
    } else {
        return res.status(400).json({ success: false, message: 'Cada detalle debe incluir un servicio o un producto válido' });
    }

    body.cantidad = cantidad;
    body.precio_unitario = precioUnitario;
    body.subtotal = precioUnitario * cantidad;

    if (body.Garantia === undefined || body.Garantia === null) body.Garantia = 0;

    const nuevoDetalle = await DetalleOrdenServicio.create(body);

    // RN-009: Descontar stock
    if (body.ID_PRODUCTOS) {
        await pool.query('UPDATE productos SET stock = stock - ? WHERE ID_PRODUCTOS = ?', [cantidad, body.ID_PRODUCTOS]);
    }

    await logHistory(
        req.user?.id_usuario || 1,
        'detalles_orden_servicio',
        nuevoDetalle.id_detalle || nuevoDetalle.insertId || 0,
        'INSERT',
        `Se agregó detalle a la orden ${body.ID_ORDEN_SERVICIO || body.id_orden || 'N/A'}`
    );

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

    await logHistory(
        req.user?.id_usuario || 1,
        'detalles_orden_servicio',
        idActual,
        'UPDATE',
        `Se actualizó el detalle ID ${idActual}`
    );

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

    await logHistory(
        req.user?.id_usuario || 1,
        'detalles_orden_servicio',
        idEliminar,
        'DELETE',
        `Se eliminó el detalle ID ${idEliminar}`
    );

    res.json({ success: true, message: 'Detalle eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};