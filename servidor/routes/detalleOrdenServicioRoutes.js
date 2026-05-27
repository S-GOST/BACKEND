import express from 'express';
import {
    obtenerDetallesOrden,
    obtenerDetalleOrdenPorId,
    crearDetalleOrden,
    actualizarDetalleOrden,
    eliminarDetalleOrden,
    obtenerDetallesPorId
} from '../controllers/detalleOrdenServicioController.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/detalles_orden_servicio)
// ==============================================

router.get('/obtener', obtenerDetallesOrden);
router.get('/por_orden/:idOrden', obtenerDetallesPorId); 
router.get('/buscar/:id', obtenerDetalleOrdenPorId);
router.post('/insertar', crearDetalleOrden);
router.put('/actualizar/:id', actualizarDetalleOrden);
router.delete('/eliminar/:id', eliminarDetalleOrden);

// ==============================================
// Documentación Swagger (summaries cortos, IDs string)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: DetalleOrden
 *   description: Detalle de órdenes de servicio (IDs tipo texto)
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/obtener:
 *   get:
 *     summary: Listar detalles
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de detalles obtenida
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/por_orden/{idOrden}:
 *   get:
 *     summary: Obtener detalles por ID de orden
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden de servicio
 *     responses:
 *       200:
 *         description: Lista de detalles de la orden
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/buscar/{id}:
 *   get:
 *     summary: Buscar detalle
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del detalle (varchar)
 *     responses:
 *       200:
 *         description: Detalle encontrado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/insertar:
 *   post:
 *     summary: Crear detalle
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_orden
 *               - descripcion
 *               - cantidad
 *               - precio
 *             properties:
 *               id_orden:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *               precio:
 *                 type: number
 *               subtotal:
 *                 type: number
 *     responses:
 *       201:
 *         description: Detalle creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/actualizar/{id}:
 *   put:
 *     summary: Actualizar detalle
 *     tags: [DetalleOrden]
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
 *               id_orden:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *               precio:
 *                 type: number
 *               subtotal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Detalle actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/eliminar/{id}:
 *   delete:
 *     summary: Eliminar detalle
 *     tags: [DetalleOrden]
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
 *         description: Detalle eliminado
 *       404:
 *         description: No encontrado
 */

export default router;