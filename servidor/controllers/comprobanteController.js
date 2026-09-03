import Comprobante from "../models/comprobanteModel.js";
import prisma from "../config/prisma.js"; // REEMPLAZO de pool
import { logHistory } from "../utils/historyLogger.js";

// Helper para limpiar BigInt y Decimales devueltos por Prisma Raw SQL
const serializeValues = (rows) => rows.map(row => {
    const newRow = { ...row };
    for (let key in newRow) {
        if (typeof newRow[key] === 'bigint') {
            newRow[key] = Number(newRow[key]);
        } else if (newRow[key] && typeof newRow[key] === 'object' && newRow[key].constructor.name === 'Decimal') {
            newRow[key] = Number(newRow[key]);
        }
    }
    return newRow;
});

export const obtenerComprobantes = async (req, res) => {
    try {
        const comprobantes = await Comprobante.findAll();
        res.json({ success: true, data: comprobantes });
    } catch (error) {
        console.error("Error al obtener comprobantes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerComprobantePorId = async (req, res) => {
    const { id } = req.params;
    try {
        const comprobante = await Comprobante.findByPk(id);
        if (!comprobante) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }
        res.json({ success: true, data: comprobante });
    } catch (error) {
        console.error("Error al obtener comprobante por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearComprobante = async (req, res) => {
    try {
        const nuevoComprobante = await Comprobante.create(req.body);
        const insertId = nuevoComprobante.id_comprobante || nuevoComprobante.ID_COMPROBANTE || 0;

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            insertId,
            'INSERT',
            `Se creó un comprobante`
        );

        res.json({ success: true, data: nuevoComprobante });
    } catch (error) {
        console.error("Error al crear comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        const comprobanteActualizado = await Comprobante.update(id, req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            id,
            'UPDATE',
            `Se actualizó el comprobante ID ${id}`
        );

        res.json({ success: true, data: comprobanteActualizado });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }
        console.error("Error al actualizar comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const eliminarComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        await Comprobante.delete(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            id,
            'DELETE',
            `Se eliminó el comprobante ID ${id}`
        );

        res.json({ success: true, message: 'Comprobante eliminado correctamente' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }
        console.error("Error al eliminar comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Generar comprobante desde un informe (HU-004.1)
 */
export const generarComprobanteDesdeInforme = async (req, res) => {
    try {
        const { idInforme } = req.params;
        const { metodo_pago } = req.body; // <-- Obtener metodo_pago del body
        const idAdmin = req.user?.id_usuario || req.admin?.id_usuario;

        // 1. Buscar el informe
        let informeRows = await prisma.$queryRawUnsafe('SELECT * FROM informe WHERE id_informe = ?', Number(idInforme));
        informeRows = serializeValues(informeRows);

        if (!informeRows || informeRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Informe no encontrado' });
        }
        const informeData = informeRows[0];

        // 2. Buscar la orden para obtener datos
        let ordenRows = await prisma.$queryRawUnsafe('SELECT * FROM orden_servicio WHERE id_orden = ?', Number(informeData.id_orden));
        ordenRows = serializeValues(ordenRows);

        if (!ordenRows || ordenRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden de servicio asociada no encontrada' });
        }

        // 3. Calcular el monto total desde los detalles de la orden
        let totalRows = await prisma.$queryRawUnsafe('SELECT COALESCE(SUM(subtotal), 0) AS monto FROM detalles_orden_servicio WHERE id_orden = ?', Number(informeData.id_orden));
        totalRows = serializeValues(totalRows);
        const subtotal = parseFloat(totalRows[0]?.monto || 0);
        const totalPagar = subtotal; // Puedes aplicar impuestos aquí si es necesario

        // 4. Verificar que no exista ya un comprobante para esta orden
        let existente = await prisma.$queryRawUnsafe('SELECT * FROM comprobante WHERE id_orden = ?', Number(informeData.id_orden));
        existente = serializeValues(existente);

        if (existente && existente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un comprobante para esta orden',
                data: existente[0]
            });
        }

        // 5. Generar número de comprobante único (COMP-YYYYMMDD-XXXX)
        const ahora = new Date();
        const fechaStr = ahora.toISOString().slice(0, 10).replace(/-/g, '');

        let countRows = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS total FROM comprobante');
        countRows = serializeValues(countRows);
        const secuencia = String((countRows[0]?.total || 0) + 1).padStart(4, '0');
        const numeroComprobante = `COMP-${fechaStr}-${secuencia}`;

        // 6. Insertar el comprobante
        const metodoPagoFinal = metodo_pago || 'Efectivo';

        await prisma.$executeRawUnsafe(
            `INSERT INTO comprobante (id_orden, numero_comprobante, fecha, subtotal, total_pagar, metodo_pago, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
            Number(informeData.id_orden), numeroComprobante, ahora, subtotal, totalPagar, metodoPagoFinal
        );

        // Buscar el ID recién insertado ya que $executeRawUnsafe no devuelve insertId
        let resultInsert = await prisma.$queryRawUnsafe('SELECT id_comprobante FROM comprobante WHERE numero_comprobante = ?', numeroComprobante);
        resultInsert = serializeValues(resultInsert);
        const insertId = resultInsert[0]?.id_comprobante || 0;

        // 7. Auditoría
        await logHistory(
            idAdmin || 1,
            'comprobante',
            insertId,
            'INSERT',
            `Admin generó comprobante ${numeroComprobante} para informe #${idInforme}, orden #${informeData.id_orden}, total: ${totalPagar}`
        );

        res.status(201).json({
            success: true,
            message: 'Comprobante generado exitosamente',
            data: {
                id_comprobante: insertId,
                id_orden: informeData.id_orden,
                numero_comprobante: numeroComprobante,
                subtotal,
                total_pagar: totalPagar,
                estado: 'Pendiente'
            }
        });
    } catch (error) {
        console.error("Error al generar comprobante desde informe:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Obtener comprobantes del cliente autenticado (HU-004.1)
 */
export const obtenerMisComprobantes = async (req, res) => {
    try {
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;

        if (!idUsuario) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        let rows = await prisma.$queryRawUnsafe(
            `SELECT c.id_comprobante, c.id_orden, c.numero_comprobante,
                    c.fecha, c.subtotal, c.total_pagar, c.metodo_pago, c.estado,
                    i.diagnostico, i.trabajo_realizado, i.recomendaciones,
                    os.fecha_ingreso, os.observaciones AS orden_observaciones
             FROM comprobante c
             INNER JOIN orden_servicio os ON c.id_orden = os.id_orden
             LEFT JOIN informe i ON i.id_orden = os.id_orden
             WHERE os.id_cliente = ?
             ORDER BY c.fecha DESC`,
            Number(idUsuario)
        );
        rows = serializeValues(rows);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al obtener comprobantes del cliente:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Cliente paga su comprobante
 */
export const pagarComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        const { metodo_pago } = req.body;
        const idUsuario = req.user?.id_usuario;

        let comprobante = await prisma.$queryRawUnsafe('SELECT * FROM comprobante WHERE id_comprobante = ?', Number(id));
        comprobante = serializeValues(comprobante);

        if (!comprobante || comprobante.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }

        if (comprobante[0].estado !== 'Pendiente') {
            return res.status(400).json({ success: false, message: 'El comprobante ya no está pendiente' });
        }

        await prisma.$executeRawUnsafe(
            'UPDATE comprobante SET estado = "Pagado", metodo_pago = COALESCE(?, metodo_pago) WHERE id_comprobante = ?',
            metodo_pago || null, Number(id)
        );

        await logHistory(
            idUsuario || 1,
            'comprobante',
            id,
            'UPDATE',
            `El cliente pagó el comprobante ${comprobante[0].numero_comprobante}`
        );

        res.json({ success: true, message: 'Comprobante pagado exitosamente' });
    } catch (error) {
        console.error("Error al pagar comprobante:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Búsqueda con filtros
 */
export const buscarComprobantesFiltro = async (req, res) => {
    try {
        const idRol = req.user?.id_rol || req.admin?.id_rol;
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;

        if (!idUsuario) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        const { numero, cliente, fecha_inicio, fecha_fin } = req.query;

        let query = `
            SELECT c.id_comprobante, c.id_orden, c.numero_comprobante,
                   c.fecha, c.subtotal, c.total_pagar, c.metodo_pago, c.estado,
                   u.nombre as cliente_nombre, u.documento as cliente_documento,
                   m.placa as moto_placa
            FROM comprobante c
            INNER JOIN orden_servicio os ON c.id_orden = os.id_orden
            INNER JOIN motos m ON os.id_moto = m.id_moto
            INNER JOIN usuarios u ON os.id_cliente = u.id_usuario
            WHERE 1=1
        `;

        const params = [];

        if (idRol === 2) {
            query += ' AND os.id_tecnico = ?';
            params.push(Number(idUsuario));
        } else if (idRol === 3) {
            query += ' AND os.id_cliente = ?';
            params.push(Number(idUsuario));
        }

        if (numero) {
            query += ' AND c.numero_comprobante LIKE ?';
            params.push(`%${numero}%`);
        }
        if (cliente && idRol !== 3) {
            query += ' AND (u.nombre LIKE ? OR u.documento LIKE ?)';
            params.push(`%${cliente}%`, `%${cliente}%`);
        }
        if (fecha_inicio && fecha_fin) {
            query += ' AND DATE(c.fecha) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }

        query += ' ORDER BY c.fecha DESC';

        let rows = await prisma.$queryRawUnsafe(query, ...params);
        rows = serializeValues(rows);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en buscarComprobantesFiltro:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
