import OrdenServicio from "../models/ordenServicioModel.js";
import pool from "../config/db.js";

// Obtener todas las órdenes de servicio
export const obtenerOrdenes = async (req, res) => {
    try {
        const filas = await OrdenServicio.findAll();
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
        const clienteId = req.admin.id; // porque tu middleware guarda en req.admin
        if (!clienteId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Consulta filtrando por el ID del cliente
        const [filas] = await pool.query(
            'SELECT * FROM ordenes_servicio WHERE ID_CLIENTES = ? ORDER BY ID_ORDEN_SERVICIO DESC',
            [clienteId]
        );

        res.json({ success: true, data: filas });
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
        const clienteId = req.admin.id; // asumiendo que el token tiene el campo 'id'
        if (!clienteId) {
            await connection.rollback();
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Buscar la moto del cliente
        const [motos] = await connection.query(
            'SELECT ID_MOTOS FROM motos WHERE ID_CLIENTES = ? ORDER BY ID_MOTOS DESC LIMIT 1',
            [clienteId]
        );
        if (!motos || motos.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'No se encontró ninguna moto asociada a este cliente'
            });
        }
        const idMoto = motos[0].ID_MOTOS;

        const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        // Los demás campos pueden venir del body (opcional)
        const ordenData = {
            ID_CLIENTES: clienteId,   // <- toma del token
            ID_MOTOS: idMoto,
            ID_ADMINISTRADOR: req.body.ID_ADMINISTRADOR || 1,
            ID_TECNICOS: req.body.ID_TECNICOS || 1,
            Fecha_inicio: req.body.Fecha_inicio || ahora,
            Fecha_estimada: req.body.Fecha_estimada || null,
            Fecha_fin: req.body.Fecha_fin || null,   // debe permitir NULL
            Estado: req.body.Estado || 'PENDIENTE'
        };

        // Insertar orden
        const [resultado] = await connection.query(
            `INSERT INTO orden_servicio 
             (ID_CLIENTES, ID_MOTOS, ID_ADMINISTRADOR, ID_TECNICOS, Fecha_inicio, Fecha_estimada, Fecha_fin, Estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ordenData.ID_CLIENTES,
                ordenData.ID_MOTOS,
                ordenData.ID_ADMINISTRADOR,
                ordenData.ID_TECNICOS,
                ordenData.Fecha_inicio,
                ordenData.Fecha_estimada,
                ordenData.Fecha_fin,
                ordenData.Estado
            ]
        );

        const idOrden = resultado.insertId;

        // Insertar detalles (si vienen en req.body.detalles)
        const detalles = req.body.detalles || [];
        for (const item of detalles) {
            const { ID_PRODUCTOS, ID_SERVICIOS, Garantia, Precio } = item;
            await connection.query(
                `INSERT INTO detalles_orden_servicio 
                 (ID_ORDEN_SERVICIO, ID_SERVICIOS, ID_PRODUCTOS, Garantía, Precio)
                 VALUES (?, ?, ?, ?, ?)`,
                [idOrden, ID_SERVICIOS || null, ID_PRODUCTOS || null, Garantia, Precio]
            );
        }

        await connection.commit();
        res.status(201).json({
            success: true,
            data: {
                ID_ORDEN_SERVICIO: idOrden,
                ID_MOTOS: idMoto,
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
        await OrdenServicio.update(id, req.body);
        const ordenActualizada = await OrdenServicio.findById(id);
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
        await OrdenServicio.delete(id);
        res.json({ success: true, message: 'Orden de servicio eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar orden de servicio:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};