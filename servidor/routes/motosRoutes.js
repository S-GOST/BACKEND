import express from 'express';
import {
    obtenerMotos,
    obtenerMotoPorId,
    crearMoto,
    actualizarMoto,
    eliminarMoto
} from '../controllers/motosController.js';
import { verificarToken } from '../middleware/Auth.js';
import { autorizar } from '../middleware/autorizar.js';
import { validarMoto } from '../middleware/validar.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/motos)
// ==============================================

// Todos los roles (Admin, Técnico, Cliente) pueden leer motos (el controlador podría filtrar por dueño)
router.get('/obtener', verificarToken, autorizar(1, 2, 3), obtenerMotos);
router.get('/buscar/:id', verificarToken, autorizar(1, 2, 3), obtenerMotoPorId);

// Admin, Técnico y Cliente pueden crear motos (cliente lo hace desde el carrito)
router.post('/insertar', verificarToken, autorizar(1, 2, 3), validarMoto, crearMoto);
router.put('/actualizar/:id', verificarToken, autorizar(1, 2), validarMoto, actualizarMoto);

// Solo Admin puede eliminar motos
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarMoto);

// ==============================================
// Documentación Swagger (summaries cortos, IDs string)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Motos
 *   description: Gestión de motos (IDs tipo texto)
 */

/**
 * @swagger
 * /api/motos/obtener:
 *   get:
 *     summary: Listar motos
 *     tags: [Motos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de motos obtenida
 */

/**
 * @swagger
 * /api/motos/buscar/{id}:
 *   get:
 *     summary: Buscar moto
 *     tags: [Motos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la moto (varchar)
 *     responses:
 *       200:
 *         description: Moto encontrada
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /api/motos/insertar:
 *   post:
 *     summary: Crear moto
 *     tags: [Motos]
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
 *               - marca
 *               - modelo
 *             properties:
 *               id:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               año:
 *                 type: integer
 *               cilindrada:
 *                 type: string
 *               color:
 *                 type: string
 *               precio:
 *                 type: number
 *     responses:
 *       201:
 *         description: Moto creada
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/motos/actualizar/{id}:
 *   put:
 *     summary: Actualizar moto
 *     tags: [Motos]
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
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               año:
 *                 type: integer
 *               cilindrada:
 *                 type: string
 *               color:
 *                 type: string
 *               precio:
 *                 type: number
 *     responses:
 *       200:
 *         description: Moto actualizada
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /api/motos/eliminar/{id}:
 *   delete:
 *     summary: Eliminar moto
 *     tags: [Motos]
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
 *         description: Moto eliminada
 *       404:
 *         description: No encontrada
 */

export default router;