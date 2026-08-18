import express from 'express';
import {
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    loginCliente,
    obtenerClientesPendientes,
    procesarAprobacionCliente
} from '../controllers/clientesController.js';
import { verificarToken } from '../middleware/Auth.js';
import { autorizar } from '../middleware/autorizar.js';
import { limiterLogin } from '../middleware/rateLimiter.js';
import { validarLogin, validarRegistroCliente } from '../middleware/validar.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/clientes)
// ==============================================
// Admin y Técnico pueden listar clientes (para ver dueños de motos/órdenes)
router.get('/obtener', verificarToken, autorizar(1, 2), obtenerClientes);
router.get('/pendientes', verificarToken, autorizar(1), obtenerClientesPendientes);
router.put('/aprobacion/:id', verificarToken, autorizar(1), procesarAprobacionCliente);
router.get('/buscar/:id', verificarToken, autorizar(1, 3), obtenerClientePorId);
router.post('/login', limiterLogin, validarLogin, loginCliente);
router.post('/insertar', validarRegistroCliente, crearCliente);  // ← Registro público (desde homepage)
router.put('/actualizar/:id', verificarToken, autorizar(1, 3), actualizarCliente);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarCliente);

// ==============================================
// Documentación Swagger
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes (IDs tipo texto)
 */

/**
 * @swagger
 * /api/clientes/obtener:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/clientes/buscar/{id}:
 *   get:
 *     summary: Buscar cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente (varchar)
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/clientes/insertar:
 *   post:
 *     summary: Registrar nuevo cliente (público)
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_documento
 *               - id_tipo_documento
 *               - nombre
 *               - usuario
 *               - password
 *               - correo
 *             properties:
 *               numero_documento:
 *                 type: string
 *                 description: "10 dígitos numéricos"
 *               id_tipo_documento:
 *                 type: integer
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               usuario:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               correo:
 *                 type: string
 *                 format: email
 *                 maxLength: 100
 *               telefono:
 *                 type: string
 *               ciudad:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente registrado
 *       400:
 *         description: Datos inválidos (validación)
 */

/**
 * @swagger
 * /api/clientes/actualizar/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Clientes]
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
 *               ciudad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/clientes/eliminar/{id}:
 *   delete:
 *     summary: Eliminar cliente
 *     tags: [Clientes]
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
 *         description: Cliente eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger 
 * /api/clientes/login:
 *   post:
 *     summary: Iniciar sesión como cliente
 *     tags: [Clientes]
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
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso (devuelve token)
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos de login
 */

/**
 * @swagger
 * /api/clientes/pendientes:
 *   get:
 *     summary: Listar clientes pendientes de aprobación (Solo Admin)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes pendientes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permisos
 */

/**
 * @swagger
 * /api/clientes/aprobacion/{id}:
 *   put:
 *     summary: Aprobar o rechazar un cliente (Solo Admin)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accion
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [Aprobar, Rechazar]
 *               justificacion:
 *                 type: string
 *                 description: Requerido si la acción es Rechazar
 *     responses:
 *       200:
 *         description: Cliente procesado y notificado
 *       400:
 *         description: Acción inválida o justificación faltante
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permisos
 *       404:
 *         description: Cliente no encontrado
 */

export default router;