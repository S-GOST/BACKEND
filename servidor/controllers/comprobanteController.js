import Comprobante from "../models/comprobanteModel.js";
import pool from "../config/db.js";
import { logHistory } from "../utils/historyLogger.js";

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

        await logHistory(
            req.user?.id_usuario || 1,
            'comprobante',
            nuevoComprobante.insertId || 0,
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
        console.error("Error al eliminar comprobante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Generar comprobante desde un informe (HU-004.1)
 * Solo Admin (Rol 1) puede ejecutar esto.
 * Busca el informe → obtiene la orden → calcula el total desde detalles.
 * 
 * Columnas reales de la tabla `comprobante`:
 *   id_comprobante (AUTO_INCREMENT), id_orden, numero_comprobante (UNIQUE),
 *   fecha, subtotal, total_pagar, metodo_pago (ENUM), estado (ENUM)
 */
export const generarComprobanteDesdeInforme = async (req, res) => {
    try {
        const { idInforme } = req.params;
        const { metodo_pago } = req.body; // <-- Obtener metodo_pago del body
        const idAdmin = req.user?.id_usuario || req.admin?.id_usuario;

        // 1. Buscar el informe
        const [informeRows] = await pool.query(
            'SELECT * FROM informe WHERE id_informe = ?',
            [idInforme]
        );

        if (!informeRows || informeRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Informe no encontrado' });
        }

        const informeData = informeRows[0];

        // 2. Buscar la orden para obtener datos
        const [ordenRows] = await pool.query(
            'SELECT * FROM orden_servicio WHERE id_orden = ?',
            [informeData.id_orden]
        );

        if (!ordenRows || ordenRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden de servicio asociada no encontrada' });
        }

        // 3. Calcular el monto total desde los detalles de la orden
        const [totalRows] = await pool.query(
            'SELECT COALESCE(SUM(subtotal), 0) AS monto FROM detalles_orden_servicio WHERE id_orden = ?',
            [informeData.id_orden]
        );
        const subtotal = parseFloat(totalRows[0]?.monto || 0);
        const totalPagar = subtotal; // Puedes aplicar impuestos aquí si es necesario

        // 4. Verificar que no exista ya un comprobante para esta orden
        const [existente] = await pool.query(
            'SELECT * FROM comprobante WHERE id_orden = ?',
            [informeData.id_orden]
        );

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
        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM comprobante');
        const secuencia = String((countRows[0]?.total || 0) + 1).padStart(4, '0');
        const numeroComprobante = `COMP-${fechaStr}-${secuencia}`;

        // 6. Insertar el comprobante con las columnas reales
        const metodoPagoFinal = metodo_pago || 'Efectivo'; 
        
        const [result] = await pool.query(
            `INSERT INTO comprobante (id_orden, numero_comprobante, fecha, subtotal, total_pagar, metodo_pago, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
            [informeData.id_orden, numeroComprobante, ahora, subtotal, totalPagar, metodoPagoFinal]
        );

        // 7. Auditoría
        await logHistory(
            idAdmin || 1,
            'comprobante',
            result.insertId || 0,
            'INSERT',
            `Admin generó comprobante ${numeroComprobante} para informe #${idInforme}, orden #${informeData.id_orden}, total: ${totalPagar}`
        );

        res.status(201).json({
            success: true,
            message: 'Comprobante generado exitosamente',
            data: {
                id_comprobante: result.insertId,
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
 * El cliente (Rol 3) ve solo sus comprobantes.
 * 
 * Columnas reales: id_comprobante, id_orden, numero_comprobante, fecha,
 *                  subtotal, total_pagar, metodo_pago, estado
 */
export const obtenerMisComprobantes = async (req, res) => {
    try {
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;

        if (!idUsuario) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        const [rows] = await pool.query(
            `SELECT c.id_comprobante, c.id_orden, c.numero_comprobante,
                    c.fecha, c.subtotal, c.total_pagar, c.metodo_pago, c.estado,
                    i.diagnostico, i.trabajo_realizado, i.recomendaciones,
                    os.fecha_ingreso, os.observaciones AS orden_observaciones
             FROM comprobante c
             INNER JOIN orden_servicio os ON c.id_orden = os.id_orden
             LEFT JOIN informe i ON i.id_orden = os.id_orden
             WHERE os.id_cliente = ?
             ORDER BY c.fecha DESC`,
            [idUsuario]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al obtener comprobantes del cliente:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Cliente paga su comprobante
 * Cambia el estado a "Pagado" y registra en historial
 */
export const pagarComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        const { metodo_pago } = req.body;
        const idUsuario = req.user?.id_usuario;

        // Verificar que el comprobante exista y esté pendiente
        const [comprobante] = await pool.query(
            'SELECT * FROM comprobante WHERE id_comprobante = ?',
            [id]
        );

        if (!comprobante || comprobante.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }

        if (comprobante[0].estado !== 'Pendiente') {
            return res.status(400).json({ success: false, message: 'El comprobante ya no está pendiente' });
        }

        // Actualizar estado a Pagado
        await pool.query(
            'UPDATE comprobante SET estado = "Pagado", metodo_pago = COALESCE(?, metodo_pago) WHERE id_comprobante = ?',
            [metodo_pago || null, id]
        );

        // Registrar en historial para que el Admin lo vea
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

        // Filtro de rol
        if (idRol === 2) {
            // Tcnico solo ve los comprobantes de sus rdenes
            query += ' AND os.id_tecnico = ?';
            params.push(idUsuario);
        } else if (idRol === 3) {
            // Cliente solo ve sus motos
            query += ' AND os.id_cliente = ?';
            params.push(idUsuario);
        }

        // Filtros adicionales
        if (numero) {
            query += ' AND c.numero_comprobante LIKE ?';
            params.push(`%${numero}%`);
        }
        if (cliente && idRol !== 3) { // Cliente no necesita buscar por cliente
            query += ' AND (u.nombre LIKE ? OR u.documento LIKE ?)';
            params.push(`%${cliente}%`, `%${cliente}%`);
        }
        if (fecha_inicio && fecha_fin) {
            query += ' AND DATE(c.fecha) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }

        query += ' ORDER BY c.fecha DESC';

        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en buscarComprobantesFiltro:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
