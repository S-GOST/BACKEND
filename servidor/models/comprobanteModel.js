import prisma from '../config/prisma.js';

// Formateamos para mantener mayúsculas en el ID si el frontend lo requiere, 
// pero usando la estructura REAL de tu base de datos actual.
const formatComprobante = (c) => {
    if (!c) return null;
    return {
        ID_COMPROBANTE: c.id_comprobante,
        id_orden: c.id_orden,
        numero_comprobante: c.numero_comprobante,
        subtotal: c.subtotal,
        total_pagar: c.total_pagar, // Esto reemplaza tu antiguo "Monto"
        metodo_pago: c.metodo_pago,
        fecha: c.fecha,
        estado: c.estado // Esto reemplaza tu antiguo "Estado_pago"
    };
};

const Comprobante = {
    // Obtener todos los comprobantes
    findAll: async () => {
        const comprobantes = await prisma.comprobante.findMany({
            include: {
                orden_servicio: true // Trae la información de la orden relacionada
            }
        });
        return comprobantes.map(formatComprobante);
    },

    // Buscar un comprobante por su ID
    findByPk: async (id) => {
        const comprobante = await prisma.comprobante.findUnique({
            where: { id_comprobante: Number(id) }
        });
        return formatComprobante(comprobante);
    },

    // Crear un nuevo comprobante
    create: async (datos) => {
        const comprobanteCreado = await prisma.comprobante.create({
            data: {
                // Mapeamos los datos reales que espera tu BD
                id_orden: Number(datos.id_orden),
                numero_comprobante: datos.numero_comprobante,
                subtotal: Number(datos.subtotal || 0),
                total_pagar: Number(datos.total_pagar || datos.Monto || 0),
                metodo_pago: datos.metodo_pago || 'Efectivo', // Enum: Efectivo, Nequi, etc.
                fecha: datos.fecha ? new Date(datos.fecha) : new Date(),
                estado: datos.estado || datos.Estado_pago || 'Pendiente' // Enum: Pendiente, Pagado, Anulado
            }
        });
        return formatComprobante(comprobanteCreado);
    },

    // Actualizar un comprobante existente
    update: async (id, datos) => {
        const comprobanteActualizado = await prisma.comprobante.update({
            where: { id_comprobante: Number(id) },
            data: {
                id_orden: datos.id_orden ? Number(datos.id_orden) : undefined,
                numero_comprobante: datos.numero_comprobante,
                subtotal: datos.subtotal ? Number(datos.subtotal) : undefined,
                total_pagar: datos.total_pagar ? Number(datos.total_pagar) : undefined,
                metodo_pago: datos.metodo_pago,
                estado: datos.estado,
                fecha: datos.fecha ? new Date(datos.fecha) : undefined
            }
        });
        return formatComprobante(comprobanteActualizado);
    },

    // Eliminar un comprobante
    delete: async (id) => {
        return await prisma.comprobante.delete({
            where: { id_comprobante: Number(id) }
        });
    },
};

export default Comprobante;
