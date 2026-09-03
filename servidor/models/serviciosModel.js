import prisma from '../config/prisma.js';

// Función ayudante para formatear el resultado igual que tu SQL antiguo
const formatServicio = (servicio) => {
    if (!servicio) return null;
    return {
        ...servicio,
        categoria_nombre: servicio.categorias ? servicio.categorias.nombre : null,
        // Opcional: eliminamos el objeto anidado para mantenerlo limpio
        categorias: undefined
    };
};

const Servicio = {
    // Obtener todos los servicios (con JOIN a categorias)
    findAll: async () => {
        const servicios = await prisma.servicios.findMany({
            include: {
                categorias: true // Esto hace el equivalente al LEFT JOIN
            }
        });
        return servicios.map(formatServicio);
    },

    // Buscar un servicio por su Clave Primaria (ID)
    findByPk: async (id) => {
        const servicio = await prisma.servicios.findUnique({
            where: { ID_SERVICIOS: Number(id) },
            include: {
                categorias: true
            }
        });
        return formatServicio(servicio);
    },

    // Buscar servicios por categoría
    findByCategoria: async (idCategoria) => {
        const servicios = await prisma.servicios.findMany({
            where: { ID_CATEGORIA: Number(idCategoria) },
            include: {
                categorias: true
            }
        });
        return servicios.map(formatServicio);
    },

    // Crear un nuevo registro
    create: async (datos) => {
        return await prisma.servicios.create({
            data: {
                // ID_SERVICIOS no es necesario si es autoincrement, pero si lo pasas lo toma
                ID_SERVICIOS: datos.ID_SERVICIOS ? Number(datos.ID_SERVICIOS) : undefined,
                ID_CATEGORIA: Number(datos.ID_CATEGORIA),
                Nombre: datos.Nombre,
                Precio: String(datos.Precio), // Según tu schema, Precio es String
                Estado: datos.Estado || 'Activo'
            }
        });
    },

    // Actualizar un registro existente
    update: async (id, datos) => {
        return await prisma.servicios.update({
            where: { ID_SERVICIOS: Number(id) },
            data: {
                ID_CATEGORIA: Number(datos.ID_CATEGORIA),
                Nombre: datos.Nombre,
                Precio: String(datos.Precio),
                Estado: datos.Estado
            }
        });
    },

    // Eliminar un registro (ahora es inhabilitar - Soft Delete)
    delete: async (id) => {
        return await prisma.servicios.update({
            where: { ID_SERVICIOS: Number(id) },
            data: { Estado: 'Inactivo' }
        });
    },

    // Restaurar (Habilitar) un servicio
    restore: async (id) => {
        return await prisma.servicios.update({
            where: { ID_SERVICIOS: Number(id) },
            data: { Estado: 'Activo' }
        });
    }
};

export default Servicio;
