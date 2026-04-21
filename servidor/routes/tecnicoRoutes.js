import express from 'express';
import {
    obtenerTec,
    obtenerTecPorId,
    crearTec,
    eliminarTec,
    actualizarTec,
    loginTecnico
} from '../controllers/tecnicoController.js';
import { verificarToken } from "../middleware/Auth.js";

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/tecnicos)
// ==============================================

router.get('/obtener', verificarToken, obtenerTec);
router.get('/buscar/:id', verificarToken, obtenerTecPorId);
router.post('/login', loginTecnico);
router.post('/insertar', verificarToken, crearTec);
router.put('/actualizar/:id', verificarToken, actualizarTec); // Solo una vez, con :id
router.delete('/eliminar/:id', verificarToken, eliminarTec);

// ==============================================
// Documentación Swagger (summaries cortos, IDs string)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Tecnicos
 *   description: Gestión de técnicos (IDs tipo texto)
 */

/**
 * @swagger
 * /api/tecnicos/obtener:
 *   get:
 *     summary: Listar técnicos
 *     tags: [Tecnicos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de técnicos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/tecnicos/buscar/{id}:
 *   get:
 *     summary: Buscar técnico
 *     tags: [Tecnicos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del técnico (varchar)
 *     responses:
 *       200:
 *         description: Técnico encontrado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/tecnicos/insertar:
 *   post:
 *     summary: Crear técnico
 *     tags: [Tecnicos]
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
 *               - email
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               especialidad:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Técnico creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/tecnicos/actualizar/{id}:
 *   put:
 *     summary: Actualizar técnico
 *     tags: [Tecnicos]
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               especialidad:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Técnico actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/tecnicos/eliminar/{id}:
 *   delete:
 *     summary: Eliminar técnico
 *     tags: [Tecnicos]
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
 *         description: Técnico eliminado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/tecnicos/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Tecnicos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *               - contrasena
 *             properties:
 *               usuario:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso (devuelve token)
 *       401:
 *         description: Credenciales inválidas
 */

export default router;