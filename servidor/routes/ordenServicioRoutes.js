import express from 'express';
import {
    obtenerOrdenes,
    obtenerOrdenPorId,
    crearOrden,
    actualizarOrden,
    eliminarOrden,
    obtenerMisOrdenes
} from '../controllers/ordenServicioController.js';
import { verificarToken } from '../middleware/Auth.js';
import { autorizar } from '../middleware/autorizar.js';
import { validarOrden } from '../middleware/validar.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/ordenes_servicio)
// ==============================================

// Admin puede leer todo
router.get('/obtener', verificarToken, autorizar(1), obtenerOrdenes);

// Mis órdenes: Técnicos y Clientes ven solo lo suyo
router.get('/mis-ordenes', verificarToken, autorizar(2, 3), obtenerMisOrdenes);

// Todos pueden buscar por ID (controller debería validar que pertenezca)
router.get('/buscar/:id', verificarToken, autorizar(1, 2, 3), obtenerOrdenPorId);

// Admin, Técnico y Cliente pueden crear; Admin y Técnico actualizar
router.post('/insertar', verificarToken, autorizar(1, 2, 3), validarOrden, crearOrden);
router.put('/actualizar/:id', verificarToken, autorizar(1, 2), validarOrden, actualizarOrden);

// Solo Admin puede eliminar
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarOrden);

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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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
 *         description: Orden eliminada exitosamente
 *       404:
 *         description: Orden no encontrada
 */

export default router;