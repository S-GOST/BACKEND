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
        const tokenData = req.admin;
        if (!tokenData) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        let clienteId = null;

        if (tokenData.id_usuario) {
            const [rows] = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
                [tokenData.id_usuario]
            );
            if (rows && rows.length > 0) clienteId = rows[0].id_usuario;
        }

        if (!clienteId && tokenData.numero_documento) {
            const [rows] = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE numero_documento = ?',
                [tokenData.numero_documento]
            );
            if (rows && rows.length > 0) clienteId = rows[0].id_usuario;
        }

        if (!clienteId && tokenData.id) {
            const [rows] = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE numero_documento = ?',
                [tokenData.id]
            );
            if (rows && rows.length > 0) clienteId = rows[0].id_usuario;
        }

        if (!clienteId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
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
            WHERE os.id_cliente = ? 
            ORDER BY os.id_orden DESC
        `, [clienteId]);

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

// Crear una nueva orden de servicio
export const crearOrden = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 🔥 Obtener el ID del cliente desde el token (NO del body)
        // Soporta ambos formatos de token:
        //   - /api/auth/login      → { id_usuario, numero_documento, rol }
        //   - /api/clientes/login  → { id: numero_documento }
        const tokenData = req.admin;
        if (!tokenData) {
            await connection.rollback();
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        let clienteId = null;

        // Caso 1: El token ya trae id_usuario (login general /api/auth/login)
        if (tokenData.id_usuario) {
            const [rows] = await connection.query(
                'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
                [tokenData.id_usuario]
            );
            if (rows && rows.length > 0) {
                clienteId = rows[0].id_usuario;
            }
        }

        // Caso 2: El token trae numero_documento directamente
        if (!clienteId && tokenData.numero_documento) {
            const [rows] = await connection.query(
                'SELECT id_usuario FROM usuarios WHERE numero_documento = ?',
                [tokenData.numero_documento]
            );
            if (rows && rows.length > 0) {
                clienteId = rows[0].id_usuario;
            }
        }

        // Caso 3: Token de /api/clientes/login → { id: numero_documento }
        if (!clienteId && tokenData.id) {
            const [rows] = await connection.query(
                'SELECT id_usuario FROM usuarios WHERE numero_documento = ?',
                [tokenData.id]
            );
            if (rows && rows.length > 0) {
                clienteId = rows[0].id_usuario;
            }
        }

        if (!clienteId) {
            await connection.rollback();
            return res.status(401).json({ success: false, error: 'Usuario no encontrado en la base de datos' });
        }

        let idMoto;

        // Si viene el ID de la moto, usarlo directamente
        if (req.body.id_moto || (req.body.moto && req.body.moto.id_moto)) {
            idMoto = req.body.id_moto || req.body.moto.id_moto;
        } 
        // Si viene un objeto moto con placa (moto nueva), la insertamos
        else if (req.body.moto && req.body.moto.placa) {
            const { placa, marca, modelo, cilindraje, kilometraje } = req.body.moto;
            const [motoRes] = await connection.query(
                `INSERT INTO motos (id_cliente, placa, marca, modelo, cilindraje, kilometraje) VALUES (?, ?, ?, ?, ?, ?)`,
                [clienteId, placa, marca, modelo, cilindraje, kilometraje]
            );
            idMoto = motoRes.insertId;
        } else {
            // Buscar la moto del cliente (fallback)
            const [motos] = await connection.query(
                'SELECT id_moto FROM motos WHERE id_cliente = ? ORDER BY id_moto DESC LIMIT 1',
                [clienteId]
            );
            if (!motos || motos.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'No se encontró ninguna moto asociada a este cliente'
                });
            }
            idMoto = motos[0].id_moto;
        }

        const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const total = req.body.total || 0;

        // Insertar orden usando las columnas de la captura
        const [resultado] = await connection.query(
            `INSERT INTO orden_servicio 
             (id_cliente, id_tecnico, id_moto, fecha_ingreso, fecha_estimada, fecha_salida, observaciones, estado, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clienteId,
                req.body.id_tecnico || 1, // Por defecto tecnico 1 si no se envía
                idMoto,
                ahora, // fecha_ingreso
                null, // fecha_estimada
                null, // fecha_salida
                req.body.observaciones || '', // observaciones
                'Pendiente', // estado
                total
            ]
        );

        const idOrden = resultado.insertId;

        // Insertar detalles uno por uno usando la cantidad real enviada
        const detalles = req.body.detalles || [];
        
        for (const detalle of detalles) {
            const idServicio = detalle.ID_SERVICIOS || null;
            const idProducto = detalle.ID_PRODUCTOS || null;
            const cantidad = detalle.cantidad || 1;
            const precioUnitario = detalle.precio_unitario || (detalle.Precio / cantidad) || 0;
            const subtotal = detalle.Precio || (cantidad * precioUnitario);
            
            await connection.query(
                `INSERT INTO detalles_orden_servicio 
                 (id_orden, ID_SERVICIOS, ID_PRODUCTOS, garantia, cantidad, precio_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idOrden, idServicio, idProducto, null, cantidad, precioUnitario, subtotal]
            );
        }

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

// Actualizar una orden de servicio existente
export const actualizarOrden = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID_ORDEN_SERVICIO es requerido' });
    }
    try {
        // Verificar existencia
        const existe = await OrdenServicio.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }
        
        // Merge existing data with new data
        const dataToUpdate = {
            ID_CLIENTES: existe.ID_CLIENTES,
            ID_TECNICOS: existe.ID_TECNICOS,
            ID_MOTOS: existe.ID_MOTOS,
            Fecha_inicio: existe.Fecha_inicio,
            Fecha_estimada: existe.Fecha_estimada,
            Fecha_fin: existe.Fecha_fin,
            Estado: existe.Estado,
            observaciones: req.body.observaciones !== undefined ? req.body.observaciones : existe.observaciones,
            ...req.body
        };

        await OrdenServicio.update(id, dataToUpdate);

        // Si se envió una garantía de productos, actualizar los detalles que sean productos
        if (req.body.garantia_productos !== undefined) {
            await pool.query('UPDATE detalles_orden_servicio SET garantia = ? WHERE id_orden = ? AND ID_PRODUCTOS IS NOT NULL', [req.body.garantia_productos, id]);
        }
        
        // Si se envió una garantía de servicios, actualizar los detalles que sean servicios
        if (req.body.garantia_servicios !== undefined) {
            await pool.query('UPDATE detalles_orden_servicio SET garantia = ? WHERE id_orden = ? AND ID_SERVICIOS IS NOT NULL', [req.body.garantia_servicios, id]);
        }

        const ordenActualizada = await OrdenServicio.findById(id);

        // Guardar en el historial si cambió el estado y hay un técnico asignado
        if (dataToUpdate.Estado !== existe.Estado && dataToUpdate.ID_TECNICOS) {
            await logHistory(
                dataToUpdate.ID_TECNICOS,
                'orden_servicio',
                id,
                'UPDATE',
                `Actualizó el estado de la orden a ${dataToUpdate.Estado}`
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