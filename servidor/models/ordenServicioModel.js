import prisma from '../config/prisma.js';

// Función ayudante para formatear el resultado igual que tu SQL antiguo con los Alias
const formatOrden = (orden) => {
  if (!orden) return null;
  return {
    ID_ORDEN_SERVICIO: orden.id_orden,
    ID_CLIENTES: orden.id_cliente,
    ID_TECNICOS: orden.id_tecnico,
    ID_MOTOS: orden.id_moto,
    Fecha_inicio: orden.fecha_ingreso,
    Fecha_estimada: orden.fecha_estimada,
    Fecha_fin: orden.fecha_salida,
    Estado: orden.estado,
    observaciones: orden.observaciones,
    total: orden.total
  };
};

const OrdenServicio = {
  // Obtener todas las órdenes
  findAll: async () => {
    const ordenes = await prisma.orden_servicio.findMany();
    return ordenes.map(formatOrden);
  },

  // Buscar una orden por su ID
  findById: async (id) => {
    const orden = await prisma.orden_servicio.findUnique({
      where: { id_orden: Number(id) }
    });
    return formatOrden(orden);
  },

  // Crear una nueva orden
  create: async (data) => {
    // Si viene la fecha vacía o undefined, dejamos que la BD/Prisma use NOW() si es posible o nulo
    const nuevaOrden = await prisma.orden_servicio.create({
      data: {
        id_cliente: Number(data.ID_CLIENTES),
        id_tecnico: Number(data.ID_TECNICOS),
        id_moto: Number(data.ID_MOTOS),
        fecha_ingreso: data.Fecha_inicio ? new Date(data.Fecha_inicio) : new Date(),
        fecha_estimada: data.Fecha_estimada ? new Date(data.Fecha_estimada) : null,
        fecha_salida: data.Fecha_fin ? new Date(data.Fecha_fin) : null,
        estado: data.Estado || 'Pendiente'
      }
    });

    // Retornamos el id que se acaba de crear, o la orden entera formateada
    return formatOrden(nuevaOrden);
  },

  // Actualizar una orden existente
  update: async (id, data) => {
    const ordenActualizada = await prisma.orden_servicio.update({
      where: { id_orden: Number(id) },
      data: {
        id_cliente: data.ID_CLIENTES ? Number(data.ID_CLIENTES) : undefined,
        id_tecnico: data.ID_TECNICOS ? Number(data.ID_TECNICOS) : undefined,
        id_moto: data.ID_MOTOS ? Number(data.ID_MOTOS) : undefined,
        fecha_ingreso: data.Fecha_inicio ? new Date(data.Fecha_inicio) : undefined,
        fecha_estimada: data.Fecha_estimada !== undefined ? (data.Fecha_estimada ? new Date(data.Fecha_estimada) : null) : undefined,
        fecha_salida: data.Fecha_fin !== undefined ? (data.Fecha_fin ? new Date(data.Fecha_fin) : null) : undefined,
        estado: data.Estado,
        observaciones: data.observaciones
      }
    });
    return formatOrden(ordenActualizada);
  },

  // Eliminar una orden 
  delete: async (id) => {
    return await prisma.orden_servicio.delete({
      where: { id_orden: Number(id) }
    });
  },
};

export default OrdenServicio;
