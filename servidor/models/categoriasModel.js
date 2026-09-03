import prisma from '../config/prisma.js';

const Categoria = {
    // Obtener todas las categorías
    findAll: async () => {
        return await prisma.categorias.findMany();
    },

    // Buscar una categoría por su ID
    findById: async (id) => {
        return await prisma.categorias.findUnique({
            where: { ID_CATEGORIA: Number(id) }
        });
    },

    // Buscar categorías por tipo (PRODUCTO o SERVICIO)
    findByTipo: async (tipo) => {
        return await prisma.categorias.findMany({
            where: { tipo: tipo }
        });
    },

    // Crear una nueva categoría
    create: async (data) => {
        return await prisma.categorias.create({
            data: {
                nombre: data.nombre,
                tipo: data.tipo, // Prisma ya sabe que debe ser un Enum (PRODUCTO, SERVICIO)
                descripcion: data.descripcion,
                estado: data.estado || 'Activo'
            }
        });
    },

    // Actualizar una categoría existente
    update: async (id, data) => {
        return await prisma.categorias.update({
            where: { ID_CATEGORIA: Number(id) },
            data: {
                nombre: data.nombre,
                tipo: data.tipo,
                descripcion: data.descripcion,
                estado: data.estado
            }
        });
    },

    // Eliminar (Inhabilitar) una categoría - Soft Delete
    delete: async (id) => {
        return await prisma.categorias.update({
            where: { ID_CATEGORIA: Number(id) },
            data: { estado: 'Inactivo' }
        });
    },

    // Restaurar (Habilitar) una categoría
    restore: async (id) => {
        return await prisma.categorias.update({
            where: { ID_CATEGORIA: Number(id) },
            data: { estado: 'Activo' }
        });
    },

    // Verificar dependencias usando la función .count() de Prisma
    checkDependencies: async (id) => {
        const productosCount = await prisma.productos.count({
            where: {
                ID_CATEGORIA: Number(id),
                Estado: 'Activo'
            }
        });

        const serviciosCount = await prisma.servicios.count({
            where: {
                ID_CATEGORIA: Number(id),
                Estado: 'Activo'
            }
        });

        return {
            productosCount,
            serviciosCount
        };
    }
};

export default Categoria;
