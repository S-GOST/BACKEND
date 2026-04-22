import express from 'express';
import {
    obtenerServicios,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    eliminarServicio
} from '../controllers/serviciosController.js';
import { verificarToken } from "../middleware/Auth.js";

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/servicios)
// ==============================================

router.get('/obtener', verificarToken, obtenerServicios);
router.get('/buscar/:id', verificarToken,  obtenerServicioPorId);
router.post('/insertar', verificarToken, crearServicio);
router.put('/actualizar/:id', verificarToken, actualizarServicio);
router.delete('/eliminar/:id', verificarToken, eliminarServicio);

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