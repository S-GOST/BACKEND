import OrdenServicio from "../models/ordenServicioModel.js";
import pool from "../config/db.js";
import { logHistory } from "../utils/historyLogger.js";

// Obtener todas las órdenes de servicio
export const obtenerOrdenes = async (req, res) => {
    try {
        const filas = await OrdenServicio.findAll();
        
        // Cargar detalles para cada orden
        for (const orden of filas) {
            const [detalles] = await pool.query(`
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
                WHERE d.id_orden = ?
            `, [orden.ID_ORDEN_SERVICIO]);
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

        let condicionWhere = '';
        let parametros = [idUsuario];

        if (rol === 2) {
            // Es Técnico
            condicionWhere = 'os.id_tecnico = ?';
        } else {
            // Asumir que es Cliente (rol 3) o fallback
            condicionWhere = 'os.id_cliente = ?';
        }

        // Traer órdenes con detalles incluidos
        const [ordenes] = await pool.query(`
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
            WHERE ${condicionWhere}
            ORDER BY os.id_orden DESC
        `, parametros);

        // Traer detalles para cada orden
        for (const orden of ordenes) {
            const [detalles] = await pool.query(`
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
                WHERE d.id_orden = ?
            `, [orden.ID_ORDEN_SERVICIO]);
            orden.detalles = detalles;
        }

        res.json({ success: true, data: ordenes });
    } catch (error) {
        console.error("Error al obtener órdenes del cliente:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Helpers para crearOrden ---
const obtenerClienteId = async (tokenData, connection) => {
    const isIdUsuario = !!tokenData.id_usuario;
    const searchValue = tokenData.id_usuario || tokenData.numero_documento || tokenData.id;
    const column = isIdUsuario ? 'id_usuario' : 'numero_documento';

    if (!searchValue) return { error: 'Usuario no encontrado en la base de datos', status: 401 };

    const [rows] = await connection.query(`SELECT id_usuario, estado FROM usuarios WHERE ${column} = ?`, [searchValue]);
    
    if (!rows || rows.length === 0) {
        return { error: 'Usuario no encontrado en la base de datos', status: 401 };
    }
    
    if (rows[0].estado !== 'Activo') {
        return { error: 'El cliente debe estar activo para crear órdenes', status: 400 };
    }
    
    return { clienteId: rows[0].id_usuario };
};

const obtenerIdMoto = async (body, clienteId, connection) => {
    const idMotoBody = body.id_moto || body.moto?.id_moto;
    if (idMotoBody) return { idMoto: idMotoBody };

    if (body.moto?.placa) {
        const { placa, marca, modelo, cilindraje, kilometraje } = body.moto;
        const [res] = await connection.query(
            `INSERT INTO motos (id_cliente, placa, marca, modelo, cilindraje, kilometraje) VALUES (?, ?, ?, ?, ?, ?)`,
            [clienteId, placa, marca, modelo, cilindraje, kilometraje]
        );
        return { idMoto: res.insertId };
    }

    const [motos] = await connection.query('SELECT id_moto FROM motos WHERE id_cliente = ? ORDER BY id_moto DESC LIMIT 1', [clienteId]);
    if (!motos || motos.length === 0) {
        return { error: 'No se encontró ninguna moto asociada a este cliente', status: 400 };
    }
    return { idMoto: motos[0].id_moto };
};

const procesarDetalles = async (detalles, idOrden, connection) => {
    for (const detalle of detalles) {
        const { ID_SERVICIOS: idServicio, ID_PRODUCTOS: idProducto, cantidad = 1 } = detalle;
        let precioUnitario = 0;

        if (idServicio) {
            const [serv] = await connection.query('SELECT Precio FROM servicios WHERE ID_SERVICIOS = ?', [idServicio]);
            if (!serv || serv.length === 0) return { error: `El servicio con ID ${idServicio} no existe`, status: 400 };
            precioUnitario = parseFloat(serv[0].Precio || 0);
        } else if (idProducto) {
            const [prod] = await connection.query('SELECT Nombre, precio_venta AS Precio, stock FROM productos WHERE ID_PRODUCTOS = ?', [idProducto]);
            if (!prod || prod.length === 0) return { error: `El producto con ID ${idProducto} no existe`, status: 400 };
            if (prod[0].stock < cantidad) return { error: `Stock insuficiente para el producto ${prod[0].Nombre}. Stock actual: ${prod[0].stock}`, status: 400 };
            precioUnitario = parseFloat(prod[0].Precio ?? prod[0].precio_venta ?? 0);
            await connection.query('UPDATE productos SET stock = stock - ? WHERE ID_PRODUCTOS = ?', [cantidad, idProducto]);
        } else {
            return { error: 'Cada detalle debe incluir un servicio o un producto válido', status: 400 };
        }

        const subtotal = cantidad * precioUnitario;
        await connection.query(
            `INSERT INTO detalles_orden_servicio (id_orden, ID_SERVICIOS, ID_PRODUCTOS, garantia, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [idOrden, idServicio || null, idProducto || null, null, cantidad, precioUnitario, subtotal]
        );
    }
    return { success: true };
};

// Crear una nueva orden de servicio
export const crearOrden = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const tokenData = req.admin;
        if (!tokenData) {
            await connection.rollback();
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        const resCliente = await obtenerClienteId(tokenData, connection);
        if (resCliente.error) {
            await connection.rollback();
            return res.status(resCliente.status).json({ success: false, error: resCliente.error });
        }
        const clienteId = resCliente.clienteId;

        const resMoto = await obtenerIdMoto(req.body, clienteId, connection);
        if (resMoto.error) {
            await connection.rollback();
            return res.status(resMoto.status).json({ success: false, error: resMoto.error });
        }
        const idMoto = resMoto.idMoto;

        const fechaIngreso = req.body.fecha_ingreso || new Date().toISOString().slice(0, 19).replace('T', ' ');
        const total = req.body.total || 0;

        const [resultado] = await connection.query(
            `INSERT INTO orden_servicio 
             (id_cliente, id_tecnico, id_moto, fecha_ingreso, fecha_estimada, fecha_salida, observaciones, estado, metodo_pago, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clienteId,
                req.body.id_tecnico || 1,
                idMoto,
                fechaIngreso,
                null,
                null,
                req.body.observaciones || '',
                'Pendiente',
                req.body.metodo_pago || 'efectivo',
                total
            ]
        );

        const idOrden = resultado.insertId;
        const detalles = req.body.detalles || [];
        
        const resDetalles = await procesarDetalles(detalles, idOrden, connection);
        if (resDetalles.error) {
            await connection.rollback();
            return res.status(resDetalles.status).json({ success: false, message: resDetalles.error });
        }

        await connection.query(
            'UPDATE orden_servicio SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM detalles_orden_servicio WHERE id_orden = ?) WHERE id_orden = ?',
            [idOrden, idOrden]
        );

        await connection.commit();

        await logHistory(
            req.user?.id_usuario || 1,
            'orden_servicio',
            idOrden,
            'INSERT',
            `Se creó la orden de servicio #${idOrden}`
        );

        res.status(201).json({
            success: true,
            data: {
                id_orden: idOrden,
                id_moto: idMoto,
                detalles_insertados: detalles.length
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error al crear orden y detalles:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
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

        const errorValidacion = validarTransicionEstado(estadoAnterior, estadoNuevo, req.admin, existe, req.body.observaciones);
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
            await pool.query('UPDATE detalles_orden_servicio SET garantia = ? WHERE id_orden = ? AND ID_PRODUCTOS IS NOT NULL', [req.body.garantia_productos, id]);
        }
        if (req.body.garantia_servicios !== undefined) {
            await pool.query('UPDATE detalles_orden_servicio SET garantia = ? WHERE id_orden = ? AND ID_SERVICIOS IS NOT NULL', [req.body.garantia_servicios, id]);
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
        // Buscar la orden (intentar ambos nombres de columna)
        let [rows] = await pool.query('SELECT * FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?', [id]);
        if (!rows || rows.length === 0) {
            [rows] = await pool.query('SELECT * FROM orden_servicio WHERE id_orden = ?', [id]);
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        // Primero eliminar los detalles asociados (FK constraint)
        await pool.query('DELETE FROM detalles_orden_servicio WHERE id_orden = ?', [id]);
        
        // Luego eliminar la orden
        await pool.query('DELETE FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?', [id]);

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