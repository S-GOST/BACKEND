import prisma from '../config/prisma.js';

const historial = {
  // Obtener todo el historial ordenado por fecha descendente
  findAll: async () => {
    return await prisma.historial.findMany({
      orderBy: {
        fecha: 'desc'
      }
    });
  },

  // Buscar un registro por su ID
  findById: async (id) => {
    return await prisma.historial.findUnique({
      where: { id_historial: Number(id) }
    });
  },

  // Obtener historial de un usuario específico, ordenado
  findByUsuarioId: async (id_usuario) => {
    return await prisma.historial.findMany({
      where: { id_usuario: Number(id_usuario) },
      orderBy: {
        fecha: 'desc'
      }
    });
  },

  // Crear un nuevo registro de historial
  create: async (data) => {
    return await prisma.historial.create({
      data: {
        id_usuario: Number(data.id_usuario),
        tabla_afectada: data.tabla_afectada,
        id_registro: Number(data.id_registro),
        accion: data.accion,
        descripcion: data.descripcion || null
      }
    });
  },

  // Actualizar un registro existente (raramente usado en historiales)
  update: async (id, data) => {
    return await prisma.historial.update({
      where: { id_historial: Number(id) },
      data: {
        id_usuario: data.id_usuario ? Number(data.id_usuario) : undefined,
        tabla_afectada: data.tabla_afectada,
        id_registro: data.id_registro ? Number(data.id_registro) : undefined,
        accion: data.accion,
        descripcion: data.descripcion
      }
    });
  },

  // Eliminar un registro
  delete: async (id) => {
    return await prisma.historial.delete({
      where: { id_historial: Number(id) }
    });
  }
};

export default historial;
