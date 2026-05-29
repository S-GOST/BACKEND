import express from 'express';
import {
    obtenerDetallesOrden,
    obtenerDetalleOrdenPorId, 
    obtenerDetallesPorId,
    crearDetalleOrden,
    actualizarDetalleOrden,
    eliminarDetalleOrden
} from '../controllers/detalleOrdenServicioController.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/detalles_orden_servicio)
// ==============================================

// 1. Obtener todos los detalles
router.get('/obtener', obtenerDetallesOrden);

// 2. Obtener detalles filtrados por la ID de la Orden (Usa findAll)
// En Swagger aparecerá como: /api/detalles_orden_servicio/por_orden/1
router.get('/por_orden/:idOrden', obtenerDetallesPorId); 

// 3. Buscar un solo detalle por su ID propio (Usa findById)
// En Swagger aparecerá como: /api/detalles_orden_servicio/buscar/1
router.get('/buscar/:id', obtenerDetalleOrdenPorId);

// 4. Crear, Actualizar, Eliminar
router.post('/insertar', crearDetalleOrden);
router.put('/actualizar/:id', actualizarDetalleOrden);
router.delete('/eliminar/:id', eliminarDetalleOrden);

// ==============================================
// Documentación Swagger
// ==============================================

/**
 * @swagger
 * tags:
 *   name: DetalleOrden
 *   description: Gestión de Detalles de Órdenes de Servicio
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/obtener:
 *   get:
 *     summary: Listar todos los detalles
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los detalles obtenida exitosamente
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/por_orden/{idOrden}:
 *   get:
 *     summary: Obtener detalles por ID de la Orden de Servicio
 *     description: Devuelve la lista de detalles asociados a una orden específica.
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la Orden de Servicio (FK)
 *     responses:
 *       200:
 *         description: Lista de detalles de la orden
 */

/**
 * @swagger
 * /api/detalles_orden_servicio/buscar/{id}:
 *   get:
 *     summary: Buscar un solo detalle por ID
 *     description: Busca un registro específico en la tabla detalle_orden_servicio por su PK.
 *     tags: [DetalleOrden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del detalle (PK)
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
 *     summary: Crear nuevo detalle
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
 *               - ID_ORDEN_SERVICIO
 *               - ID_SERVICIOS
 *               - ID_PRODUCTOS
 *             properties:
 *               ID_ORDEN_SERVICIO:
 *                 type: string
 *               ID_SERVICIOS:
 *                 type: string
 *               ID_PRODUCTOS:
 *                 type: string
 *               Garantia:
 *                 type: integer
 *               Precio:
 *                 type: number
 *     responses:
 *       201:
 *         description: Detalle creado exitosamente
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
 *               ID_ORDEN_SERVICIO:
 *                 type: string
 *               ID_SERVICIOS:
 *                 type: string
 *               ID_PRODUCTOS:
 *                 type: string
 *               Garantia:
 *                 type: integer
 *               Precio:
 *                 type: number
 *     responses:
 *       200:
 *         description: Detalle actualizado correctamente
 *       404:
 *         description: Detalle no encontrado
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
 *         description: Detalle eliminado correctamente
 *       404:
 *         description: No encontrado
 */

export default router;