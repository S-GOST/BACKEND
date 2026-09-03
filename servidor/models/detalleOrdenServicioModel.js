import prisma from '../config/prisma.js';

// Función ayudante para mapear los resultados al formato que espera el frontend
const formatDetalle = (detalle) => {
  if (!detalle) return null;
  return {
    ID_DETALLES_ORDEN_SERVICIO: detalle.id_detalle,
    ID_ORDEN_SERVICIO: detalle.id_orden,
    ID_SERVICIOS: detalle.ID_SERVICIOS,
    ID_PRODUCTOS: detalle.ID_PRODUCTOS,
    NombreServicio: detalle.servicios ? detalle.servicios.Nombre : null,
    NombreProducto: detalle.productos ? detalle.productos.Nombre : null,
    cantidad: detalle.cantidad,
    Garantia: detalle.garantia,
    Precio: detalle.precio_unitario,
    subtotal: detalle.subtotal
  };
};

const DetalleOrdenServicio = {
  // 1. Obtener todos los detalles
  findAll: async () => {
    const detalles = await prisma.detalles_orden_servicio.findMany({
      include: {
        servicios: true,
        productos: true
      }
    });
    return detalles.map(formatDetalle);
  },

  // 2. Buscar por ID del detalle (PK)
  findById: async (id) => {
    const detalle = await prisma.detalles_orden_servicio.findUnique({
      where: { id_detalle: Number(id) },
      include: {
        servicios: true,
        productos: true
      }
    });
    return formatDetalle(detalle);
  },

  // 3. Obtener detalles de una orden específica (con JOIN)
  findByOrderId: async (idOrden) => {
    const detalles = await prisma.detalles_orden_servicio.findMany({
      where: { id_orden: Number(idOrden) },
      include: {
        servicios: true, // Reemplaza LEFT JOIN servicios
        productos: true  // Reemplaza LEFT JOIN productos
      }
    });
    return detalles.map(formatDetalle);
  },

  // 4. Crear un solo detalle
  create: async (data) => {
    const detalleCreado = await prisma.detalles_orden_servicio.create({
      data: {
        id_orden: Number(data.id_orden || data.ID_ORDEN_SERVICIO),
        ID_SERVICIOS: (data.ID_SERVICIOS !== undefined && data.ID_SERVICIOS !== null) ? Number(data.ID_SERVICIOS) : null,
        ID_PRODUCTOS: (data.ID_PRODUCTOS !== undefined && data.ID_PRODUCTOS !== null) ? Number(data.ID_PRODUCTOS) : null,
        garantia: Number(data.garantia || data.Garantia || 0),
        cantidad: Number(data.cantidad || 1),
        precio_unitario: Number(data.precio_unitario || data.Precio || 0),
        subtotal: Number(data.subtotal || data.Precio || 0)
      }
    });

    // Retornamos el id que se acaba de crear y mezclamos con la info de entrada
    return { id_detalle: detalleCreado.id_detalle, ...data };
  },

  // 5. Actualizar un detalle
  update: async (id, data) => {
    return await prisma.detalles_orden_servicio.update({
      where: { id_detalle: Number(id) },
      data: {
        id_orden: data.ID_ORDEN_SERVICIO ? Number(data.ID_ORDEN_SERVICIO) : undefined,
        ID_SERVICIOS: (data.ID_SERVICIOS !== undefined && data.ID_SERVICIOS !== null) ? Number(data.ID_SERVICIOS) : null,
        ID_PRODUCTOS: (data.ID_PRODUCTOS !== undefined && data.ID_PRODUCTOS !== null) ? Number(data.ID_PRODUCTOS) : null,
        garantia: data.Garantia !== undefined ? Number(data.Garantia) : undefined,
        precio_unitario: data.Precio !== undefined ? Number(data.Precio) : undefined
      }
    });
  },

  // 6. Eliminar un detalle
  delete: async (id) => {
    return await prisma.detalles_orden_servicio.delete({
      where: { id_detalle: Number(id) }
    });
  }
};

export default DetalleOrdenServicio;
