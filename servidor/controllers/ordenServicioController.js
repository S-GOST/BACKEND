import OrdenServicio from "../models/ordenServicioModel.js";
import prisma from "../config/prisma.js"; // REEMPLAZO de pool
import { logHistory } from "../utils/historyLogger.js";
import { Prisma } from '@prisma/client';

// Obtener todas las órdenes de servicio
export const obtenerOrdenes = async (req, res) => {
    try {
        const filas = await OrdenServicio.findAll();

        // Cargar detalles para cada orden
        for (const orden of filas) {
            const detalles = await prisma.$queryRaw`
                SELECT 
                    d.id_detalle,
                    d.ID_SERVICIOS,
                    d.ID_PRODUCTOS,
                    d.cantidad,
                    d.garantia,
                    d.precio_unitario,
                    d.subtotal,
                    s.nombre AS NombreServicio,
                    p.Nombre AS NombreProducto
                FROM detalles_orden_servicio d
                LEFT JOIN servicios s ON d.ID_SERVICIOS = s.ID_SERVICIOS
                LEFT JOIN productos p ON d.ID_PRODUCTOS = p.ID_PRODUCTOS
                WHERE d.id_orden = ${orden.ID_ORDEN_SERVICIO}
            `;
            orden.detalles = detalles;
        }

        res.json({ success: true, data: filas });
    } catch (error) {
        console.error("Error al obtener órdenes de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener una orden de servicio por su ID
export const obtenerOrdenPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const orden = await OrdenServicio.findById(id);
        if (!orden) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }
        res.json({ success: true, data: orden });
    } catch (error) {
        console.error("Error al obtener orden por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener órdenes del cliente autenticado (desde el token)
export const obtenerMisOrdenes = async (req, res) => {
    try {
        const tokenData = req.user;
        if (!tokenData) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        const idUsuario = tokenData.id_usuario;
        const rol = tokenData.rol;

        if (!idUsuario) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Consulta Raw dinámica para obtener las órdenes
        const query = Prisma.sql`
            SELECT 
                os.id_orden AS ID_ORDEN_SERVICIO, 
                os.id_cliente AS ID_CLIENTES, 
                os.id_tecnico AS ID_TECNICOS, 
                os.id_moto AS ID_MOTOS, 
                os.fecha_ingreso AS Fecha_inicio, 
                os.fecha_estimada AS Fecha_estimada, 
                os.fecha_salida AS Fecha_fin, 
                os.estado AS Estado,
                os.total,
                m.placa AS PlacaMoto,
                m.marca AS MarcaMoto,
                m.modelo AS ModeloMoto
            FROM orden_servicio os
            LEFT JOIN motos m ON os.id_moto = m.id_moto
            WHERE ${rol === 2 ? Prisma.raw('os.id_tecnico') : Prisma.raw('os.id_cliente')} = ${idUsuario}
            ORDER BY os.id_orden DESC
        `;
        const ordenes = await prisma.$queryRaw(query);

        // Traer detalles para cada orden
        for (const orden of ordenes) {
            const detalles = await prisma.$queryRaw`
                SELECT 
                    d.id_detalle,
                    d.ID_SERVICIOS,
                    d.ID_PRODUCTOS,
                    d.cantidad,
                    d.garantia,
                    d.precio_unitario,
                    d.subtotal,
                    s.nombre AS NombreServicio,
                    p.Nombre AS NombreProducto
                FROM detalles_orden_servicio d
                LEFT JOIN servicios s ON d.ID_SERVICIOS = s.ID_SERVICIOS
                LEFT JOIN productos p ON d.ID_PRODUCTOS = p.ID_PRODUCTOS
                WHERE d.id_orden = ${orden.ID_ORDEN_SERVICIO}
            `;
            orden.detalles = detalles;
        }

        res.json({ success: true, data: ordenes });
    } catch (error) {
        console.error("Error al obtener órdenes del cliente:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Helpers para crearOrden usando Transacciones de Prisma (tx) ---
const obtenerClienteId = async (tokenData, tx) => {
    const isIdUsuario = !!tokenData.id_usuario;
    const searchValue = tokenData.id_usuario || tokenData.numero_documento || tokenData.id;

    if (!searchValue) return { error: 'Usuario no encontrado en la base de datos', status: 401 };

    const user = await tx.usuarios.findFirst({
        where: isIdUsuario ? { id_usuario: Number(searchValue) } : { numero_documento: BigInt(searchValue) },
        select: { id_usuario: true, estado: true }
    });

    if (!user) {
        return { error: 'Usuario no encontrado en la base de datos', status: 401 };
    }

    if (user.estado !== 'Activo') {
        return { error: 'El cliente debe estar activo para crear órdenes', status: 400 };
    }

    return { clienteId: user.id_usuario };
};

const obtenerIdMoto = async (body, clienteId, tx) => {
    const idMotoBody = body.id_moto || body.moto?.id_moto;
    if (idMotoBody) return { idMoto: Number(idMotoBody) };

    if (body.moto?.placa) {
        const { placa, marca, modelo, cilindraje, kilometraje } = body.moto;
        const resMoto = await tx.motos.create({
            data: { id_cliente: clienteId, placa, marca, modelo, cilindraje, kilometraje }
        });
        return { idMoto: resMoto.id_moto };
    }

    const ultimaMoto = await tx.motos.findFirst({
        where: { id_cliente: clienteId },
        orderBy: { id_moto: 'desc' }
    });

    if (!ultimaMoto) {
        return { error: 'No se encontró ninguna moto asociada a este cliente', status: 400 };
    }
    return { idMoto: ultimaMoto.id_moto };
};

const procesarDetalles = async (detalles, idOrden, tx) => {
    for (const detalle of detalles) {
        const { ID_SERVICIOS: idServicio, ID_PRODUCTOS: idProducto, cantidad = 1 } = detalle;
        let precioUnitario = 0;

        if (idServicio) {
            const serv = await tx.servicios.findUnique({ where: { ID_SERVICIOS: Number(idServicio) } });
            if (!serv) return { error: `El servicio con ID ${idServicio} no existe`, status: 400 };
            precioUnitario = parseFloat(serv.Precio || 0);
        } else if (idProducto) {
            const prod = await tx.productos.findUnique({ where: { ID_PRODUCTOS: Number(idProducto) } });
            if (!prod) return { error: `El producto con ID ${idProducto} no existe`, status: 400 };
            if (prod.stock < cantidad) return { error: `Stock insuficiente para el producto ${prod.Nombre}. Stock actual: ${prod.stock}`, status: 400 };
            precioUnitario = parseFloat(prod.Precio ?? prod.precio_venta ?? 0);

            await tx.productos.update({
                where: { ID_PRODUCTOS: Number(idProducto) },
                data: { stock: { decrement: Number(cantidad) } }
            });
        } else {
            return { error: 'Cada detalle debe incluir un servicio o un producto válido', status: 400 };
        }

        const subtotal = cantidad * precioUnitario;
        await tx.detalles_orden_servicio.create({
            data: {
                id_orden: idOrden,
                ID_SERVICIOS: idServicio ? Number(idServicio) : null,
                ID_PRODUCTOS: idProducto ? Number(idProducto) : null,
                cantidad: Number(cantidad),
                precio_unitario: precioUnitario,
                subtotal: subtotal
            }
        });
    }
    return { success: true };
};

// Crear una nueva orden de servicio
export const crearOrden = async (req, res) => {
    try {
        const tokenData = req.admin || req.user;
        if (!tokenData) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Iniciamos la Transacción Mágica de Prisma
        const result = await prisma.$transaction(async (tx) => {
            const resCliente = await obtenerClienteId(tokenData, tx);
            if (resCliente.error) throw resCliente; // Throw hace rollback automático
            const clienteId = resCliente.clienteId;

            const resMoto = await obtenerIdMoto(req.body, clienteId, tx);
            if (resMoto.error) throw resMoto;
            const idMoto = resMoto.idMoto;

            const fechaIngreso = req.body.fecha_ingreso ? new Date(req.body.fecha_ingreso) : new Date();
            const totalInicial = req.body.total || 0;

            const nuevaOrden = await tx.orden_servicio.create({
                data: {
                    id_cliente: clienteId,
                    id_tecnico: req.body.id_tecnico ? Number(req.body.id_tecnico) : 1,
                    id_moto: idMoto,
                    fecha_ingreso: fechaIngreso,
                    estado: 'Pendiente',
                    metodo_pago: req.body.metodo_pago || 'efectivo',
                    total: totalInicial,
                    observaciones: req.body.observaciones || ''
                }
            });

            const idOrden = nuevaOrden.id_orden;
            const detalles = req.body.detalles || [];

            const resDetalles = await procesarDetalles(detalles, idOrden, tx);
            if (resDetalles.error) throw resDetalles;

            // Recalcular total si hay detalles sumando los subtotales insertados
            if (detalles.length > 0) {
                const aggregations = await tx.detalles_orden_servicio.aggregate({
                    _sum: { subtotal: true },
                    where: { id_orden: idOrden }
                });

                await tx.orden_servicio.update({
                    where: { id_orden: idOrden },
                    data: { total: aggregations._sum.subtotal || 0 }
                });
            }

            return { id_orden: idOrden, id_moto: idMoto, detalles_insertados: detalles.length };
        });

        // Si llegó hasta aquí, el Commit fue exitoso!
        await logHistory(
            req.user?.id_usuario || 1,
            'orden_servicio',
            result.id_orden,
            'INSERT',
            `Se creó la orden de servicio #${result.id_orden}`
        );

        res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Error al crear orden y detalles:", error);
        // Atrapamos nuestros errores personalizados de los helpers y los devolvemos limpios
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.error });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Helpers para actualizarOrden ---
const validarTransicionEstado = (estadoAnterior, estadoNuevo, usuarioAutenticado, existe, observaciones) => {
    if (estadoNuevo === estadoAnterior) return null;

    if (usuarioAutenticado.rol !== 1 && (existe.ID_TECNICOS && existe.ID_TECNICOS !== usuarioAutenticado.id_usuario)) {
        return { message: 'Solo el administrador o el técnico asignado pueden cambiar el estado', status: 403 };
    }
    if (estadoAnterior === 'Completada' || estadoAnterior === 'Cancelada') {
        return { message: `La orden está ${estadoAnterior} y no se puede modificar.`, status: 400 };
    }
    if (estadoNuevo === 'En Proceso' && estadoAnterior !== 'Pendiente') {
        return { message: 'Solo se puede cambiar a En Proceso si está Pendiente.', status: 400 };
    }
    if (estadoNuevo === 'Completada' && estadoAnterior !== 'En Proceso') {
        return { message: 'Solo se puede Completar si está En Proceso.', status: 400 };
    }
    if (estadoNuevo === 'Cancelada' && !observaciones) {
        return { message: 'Se requieren observaciones para cancelar la orden.', status: 400 };
    }
    return null;
};

// Actualizar una orden de servicio existente
export const actualizarOrden = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID_ORDEN_SERVICIO es requerido' });
    }
    try {
        const existe = await OrdenServicio.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        const estadoAnterior = existe.Estado;
        const estadoNuevo = req.body.Estado || estadoAnterior;

        // La validación original requería req.admin, pero si el técnico la actualiza vendrá en req.user
        // Se asume que req.user o req.admin tienen la misma estructura.
        const authUser = req.admin || req.user || {};

        const errorValidacion = validarTransicionEstado(estadoAnterior, estadoNuevo, authUser, existe, req.body.observaciones);
        if (errorValidacion) {
            return res.status(errorValidacion.status).json({ success: false, message: errorValidacion.message });
        }

        const dataToUpdate = {
            ID_CLIENTES: existe.ID_CLIENTES,
            ID_TECNICOS: existe.ID_TECNICOS,
            ID_MOTOS: existe.ID_MOTOS,
            Fecha_inicio: existe.Fecha_inicio,
            Fecha_estimada: existe.Fecha_estimada,
            Fecha_fin: existe.Fecha_fin,
            Estado: estadoNuevo,
            observaciones: req.body.observaciones !== undefined ? req.body.observaciones : existe.observaciones,
            ...req.body
        };

        await OrdenServicio.update(id, dataToUpdate);

        if (req.body.garantia_productos !== undefined) {
            await prisma.detalles_orden_servicio.updateMany({
                where: { id_orden: Number(id), ID_PRODUCTOS: { not: null } },
                data: { garantia: req.body.garantia_productos }
            });
        }
        if (req.body.garantia_servicios !== undefined) {
            await prisma.detalles_orden_servicio.updateMany({
                where: { id_orden: Number(id), ID_SERVICIOS: { not: null } },
                data: { garantia: req.body.garantia_servicios }
            });
        }

        const ordenActualizada = await OrdenServicio.findById(id);

        if (estadoNuevo !== estadoAnterior) {
            await logHistory(
                req.user?.id_usuario || 1,
                'orden_servicio',
                id,
                'UPDATE',
                `Cambió estado de ${estadoAnterior} a ${estadoNuevo}. Obs: ${dataToUpdate.observaciones || 'N/A'}`
            );
        }

        res.json({ success: true, data: ordenActualizada });
    } catch (error) {
        console.error("Error al actualizar orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar una orden de servicio
export const eliminarOrden = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID_ORDEN_SERVICIO es requerido' });
    }
    try {
        const existe = await OrdenServicio.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        // Primero eliminar los detalles asociados (FK constraint)
        await prisma.detalles_orden_servicio.deleteMany({
            where: { id_orden: Number(id) }
        });

        // Luego eliminar la orden usando el modelo
        await OrdenServicio.delete(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'orden_servicio',
            id,
            'DELETE',
            `Se eliminó la orden de servicio #${id}`
        );

        res.json({ success: true, message: 'Orden de servicio eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
