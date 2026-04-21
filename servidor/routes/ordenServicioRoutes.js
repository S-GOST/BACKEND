import express from 'express';
import {
    obtenerOrdenes,
    obtenerOrdenPorId,
    crearOrden,
    actualizarOrden,
    eliminarOrden
} from '../controllers/ordenServicioController.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/ordenes_servicio)
// ==============================================

router.get('/obtener', obtenerOrdenes);
router.get('/buscar/:id', obtenerOrdenPorId);
router.post('/insertar', crearOrden);
router.put('/actualizar/:id', actualizarOrden);
router.delete('/eliminar/:id', eliminarOrden);

// ==============================================
// Documentación Swagger (summaries cortos, IDs string)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: OrdenesServicio
 *   description: Gestión de órdenes de servicio (IDs tipo texto)
 */

/**
 * @swagger
 * /api/ordenes_servicio/obtener:
 *   get:
 *     summary: Listar órdenes
 *     tags: [OrdenesServicio]
 *     responses:
 *       200:
 *         description: Lista de órdenes obtenida exitosamente
 */

/**
 * @swagger
 * /api/ordenes_servicio/buscar/{id}:
 *   get:
 *     summary: Buscar orden
 *     tags: [OrdenesServicio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 'ID de la orden (ej: "ORD-001")'
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 */

/**
 * @swagger
 * /api/ordenes_servicio/insertar:
 *   post:
 *     summary: Crear orden
 *     tags: [OrdenesServicio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_cliente
 *               - id_tecnico
 *               - fecha
 *               - estado
 *             properties:
 *               id_cliente:
 *                 type: string
 *               id_tecnico:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, completada, cancelada]
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/ordenes_servicio/actualizar/{id}:
 *   put:
 *     summary: Actualizar orden
 *     tags: [OrdenesServicio]
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
 *               id_cliente:
 *                 type: string
 *               id_tecnico:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, completada, cancelada]
 *     responses:
 *       200:
 *         description: Orden actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Orden no encontrada
 */

/**
 * @swagger
 * /api/ordenes_servicio/eliminar/{id}:
 *   delete:
 *     summary: Eliminar orden
 *     tags: [OrdenesServicio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orden eliminada exitosamente
 *       404:
 *         description: Orden no encontrada
 */

export default router;