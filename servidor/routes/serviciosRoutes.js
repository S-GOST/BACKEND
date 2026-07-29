import express from 'express';
import {
    obtenerServicios,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    eliminarServicio
} from '../controllers/serviciosController.js';
import { verificarToken } from '../middleware/Auth.js';
import { autorizar } from '../middleware/autorizar.js';
import { validarServicio } from '../middleware/validar.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/servicios)
// ==============================================

// Público: Todos pueden ver los servicios (HomePage)
router.get('/obtener', obtenerServicios);
router.get('/buscar/:id', obtenerServicioPorId);

// Solo Admin puede crear, actualizar o eliminar
router.post('/insertar', verificarToken, autorizar(1), validarServicio, crearServicio);
router.put('/actualizar/:id', verificarToken, autorizar(1), validarServicio, actualizarServicio);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarServicio);

// ==============================================
// Documentación Swagger (summaries cortos, IDs string)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Servicios
 *   description: Gestión de servicios (IDs tipo texto)
 */

/**
 * @swagger
 * /api/servicios/obtener:
 *   get:
 *     summary: Listar servicios
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios obtenida
 */

/**
 * @swagger
 * /api/servicios/buscar/{id}:
 *   get:
 *     summary: Buscar servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio (varchar)
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/servicios/insertar:
 *   post:
 *     summary: Crear servicio
 *     tags: [Servicios]
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
 *               - nombre
 *               - precio
 *             properties:
 *               id:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               duracion_estimada:
 *                 type: string
 *     responses:
 *       201:
 *         description: Servicio creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/servicios/actualizar/{id}:
 *   put:
 *     summary: Actualizar servicio
 *     tags: [Servicios]
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
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               duracion_estimada:
 *                 type: string
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/servicios/eliminar/{id}:
 *   delete:
 *     summary: Eliminar servicio
 *     tags: [Servicios]
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
 *         description: Servicio eliminado
 *       404:
 *         description: No encontrado
 */

export default router;