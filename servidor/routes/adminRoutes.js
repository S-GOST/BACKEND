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

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/admins)
// ==============================================

router.get('/obtener', verificarToken, obtenerAdmins);
router.get('/buscar/:id', verificarToken, obtenerAdminPorId);
router.post('/login', loginAdmin);
router.post('/insertar', verificarToken, crearAdmin);
router.put('/actualizar/:id', verificarToken, actualizarAdmin);
router.delete('/eliminar/:id', verificarToken, eliminarAdmin);

// ==============================================
// Documentación Swagger (summaries cortos)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Gestión de administradores (IDs tipo texto)
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
 */

/**
 * @swagger
 * /api/admins/buscar/{id}:
 *   get:
 *     summary: Buscar administrador
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Administrador encontrado
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
 *               rol:
 *                 type: string
 *                 default: "admin"
 *     responses:
 *       201:
 *         description: Administrador creado
 *       400:
 *         description: Datos inválidos
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Administrador actualizado
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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso (devuelve token)
 *       401:
 *         description: Credenciales inválidas
 */

export default router;