import prisma from '../config/prisma.js';

const Informe = {
    // Obtener todos los informes
    findAll: async () => {
        return await prisma.informe.findMany();
    },

    // Buscar un informe por su ID (PK: id_informe)
    findById: async (id) => {
        return await prisma.informe.findUnique({
            where: { id_informe: Number(id) }
        });
    },

    // Crear un nuevo informe
    create: async (data) => {
        return await prisma.informe.create({
            data: {
                id_orden: Number(data.id_orden),
                id_tecnico: Number(data.id_tecnico),
                diagnostico: data.diagnostico,
                trabajo_realizado: data.trabajo_realizado,
                recomendaciones: data.recomendaciones
                // "fecha" se crea automáticamente con default(now()) en tu base de datos/Prisma
            }
        });
    },

    // Actualizar un informe existente
    update: async (id, data) => {
        return await prisma.informe.update({
            where: { id_informe: Number(id) },
            data: {
                // Usamos undefined condicional para actualizar solo lo que venga en "data"
                id_orden: data.id_orden ? Number(data.id_orden) : undefined,
                id_tecnico: data.id_tecnico ? Number(data.id_tecnico) : undefined,
                diagnostico: data.diagnostico,
                trabajo_realizado: data.trabajo_realizado,
                recomendaciones: data.recomendaciones
            }
        });
    },

    // Eliminar un informe
    delete: async (id) => {
        return await prisma.informe.delete({
            where: { id_informe: Number(id) }
        });
    }
};

export default Informe;
