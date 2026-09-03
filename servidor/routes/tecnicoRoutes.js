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
import { autorizar } from "../middleware/autorizar.js";
import { limiterLogin } from "../middleware/rateLimiter.js";
import { validarLogin, validarUsuario } from "../middleware/validar.js";

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/tecnicos)
// Solo Admin (rol 1) puede gestionar técnicos
// ==============================================

router.get('/obtener', verificarToken, autorizar(1), obtenerTec);
router.get('/buscar/:id', verificarToken, autorizar(1, 2), obtenerTecPorId);
router.post('/login', limiterLogin, validarLogin, loginTecnico);
router.post('/insertar', verificarToken, autorizar(1), validarUsuario, crearTec);
router.put('/actualizar/:id', verificarToken, autorizar(1), actualizarTec);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarTec);

// ==============================================
// Documentación Swagger
// ==============================================

/**
 * @swagger
 * tags:
 *   - name: Tecnicos
 *     description: Gestión de técnicos
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
 *       403:
 *         description: No tienes permisos
 */

/**
 * @swagger
 * /api/tecnicos/buscar/{id}:
 *   get:
 *     summary: Buscar técnico por ID
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
 *         description: Técnico encontrado
 *       401:
 *         description: No autorizado
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
 *               - numero_documento
 *               - nombre
 *               - usuario
 *               - correo
 *               - password
 *               - telefono
 *             properties:
 *               numero_documento:
 *                 type: string
 *               nombre:
 *                 type: string
 *               usuario:
 *                 type: string
 *               correo:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Técnico creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
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
 *               correo:
 *                 type: string
 *               password:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Técnico actualizado
 *       401:
 *         description: No autorizado
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
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/tecnicos/login:
 *   post:
 *     summary: Iniciar sesión como técnico
 *     tags: [Tecnicos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *               - password
 *             properties:
 *               usuario:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso (devuelve token)
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos de login
 */

export default router;