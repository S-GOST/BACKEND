import express from 'express';
import { 
    obtenerComprobantes, 
    obtenerComprobantePorId, 
    crearComprobante, 
    actualizarComprobante, 
    eliminarComprobante,
    generarComprobanteDesdeInforme,
    obtenerMisComprobantes,
    pagarComprobante,
    buscarComprobantesFiltro
} from '../controllers/comprobanteController.js';
import { verificarToken } from "../middleware/Auth.js";
import { autorizar } from "../middleware/autorizar.js";

const router = express.Router();

// Rutas para la gestión de comprobantes
router.get('/obtener', verificarToken, autorizar(1), obtenerComprobantes);
router.get('/buscar/:id', verificarToken, autorizar(1, 2, 3), obtenerComprobantePorId);
router.post('/insertar', verificarToken, autorizar(1), crearComprobante);
router.put('/actualizar/:id', verificarToken, autorizar(1), actualizarComprobante);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarComprobante);

// HU-004.1: Admin genera comprobante desde un informe
router.post('/generar/:idInforme', verificarToken, autorizar(1), generarComprobanteDesdeInforme);

// HU-004.1: Cliente consulta sus comprobantes
router.get('/mis-comprobantes', verificarToken, autorizar(3), obtenerMisComprobantes);

// Cliente (y Admin) pueden pagar comprobante
router.put('/pagar/:id', verificarToken, autorizar(1, 3), pagarComprobante);

// HU-004.1 / RF-0038: Buscar comprobantes unificado
router.get('/buscar-todos', verificarToken, autorizar(1, 2, 3), buscarComprobantesFiltro);

// ==============================================
// Documentación Swagger: Comprobantes
// ==============================================

/**
 * @swagger
 * tags:
 *   - name: Comprobantes
 *     description: Gestión de comprobantes de pago/venta (IDs tipo texto)
 */

/**
 * @swagger
 * /api/comprobantes/obtener:
 *   get:
 *     summary: Listar comprobantes
 *     tags: [Comprobantes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comprobantes obtenida
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/comprobantes/buscar/{id}:
 *   get:
 *     summary: Buscar comprobante
 *     tags: [Comprobantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comprobante (UUID o código string)
 *     responses:
 *       200:
 *         description: Comprobante encontrado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/comprobantes/insertar:
 *   post:
 *     summary: Crear comprobante
 *     tags: [Comprobantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - fecha
 *               - total
 *               - clienteId
 *             properties:
 *               id:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               tipo:
 *                 type: string
 *                 description: Ejemplo (Factura, Boleta, Ticket)
 *               total:
 *                 type: number
 *                 format: float
 *               clienteId:
 *                 type: string
 *               metodoPago:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comprobante creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/comprobantes/actualizar/{id}:
 *   put:
 *     summary: Actualizar comprobante
 *     tags: [Comprobantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               tipo:
 *                 type: string
 *               total:
 *                 type: number
 *               estado:
 *                 type: string
 *                 description: (Pagado, Anulado, Pendiente)
 *     responses:
 *       200:
 *         description: Comprobante actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/comprobantes/eliminar/{id}:
 *   delete:
 *     summary: Eliminar comprobante
 *     tags: [Comprobantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comprobante eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

export default router;