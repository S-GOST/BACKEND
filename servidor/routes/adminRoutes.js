import express from 'express';
import {
    obtenerAdmins,
    obtenerAdminPorId,
    crearAdmin,
    eliminarAdmin,
    actualizarAdmin,
    loginAdmin
} from '../controllers/adminController.js';
import { verificarToken } from "../middleware/Auth.js";
import { autorizar } from "../middleware/autorizar.js";
import { limiterLogin } from "../middleware/rateLimiter.js";
import { validarLogin, validarUsuario } from "../middleware/validar.js";

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/admins)
// Solo Admin (rol 1) puede gestionar admins
// ==============================================

router.get('/obtener', verificarToken, autorizar(1), obtenerAdmins);
router.get('/buscar/:id', verificarToken, autorizar(1), obtenerAdminPorId);
router.post('/login', limiterLogin, validarLogin, loginAdmin);
router.post('/insertar', verificarToken, autorizar(1), validarUsuario, crearAdmin);
router.put('/actualizar/:id', verificarToken, autorizar(1), actualizarAdmin);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarAdmin);

// ==============================================
// Documentación Swagger
// ==============================================

/**
 * @swagger
 * tags:
 *   - name: Admins
 *     description: Gestión de administradores (IDs tipo texto)
 */

/**
 * @swagger
 * /api/admins/obtener:
 *   get:
 *     summary: Listar administradores
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de administradores
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permisos
 */

/**
 * @swagger
 * /api/admins/buscar/{id}:
 *   get:
 *     summary: Buscar administrador por ID
 *     tags: [Admins]
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
 *         description: Administrador encontrado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/admins/insertar:
 *   post:
 *     summary: Crear administrador
 *     tags: [Admins]
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
 *               rol:
 *                 type: string
 *                 default: "admin"
 *     responses:
 *       201:
 *         description: Administrador creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/admins/actualizar/{id}:
 *   put:
 *     summary: Actualizar administrador
 *     tags: [Admins]
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
 *               rol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Administrador actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/admins/eliminar/{id}:
 *   delete:
 *     summary: Eliminar administrador
 *     tags: [Admins]
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
 *         description: Administrador eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/admins/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Admins]
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