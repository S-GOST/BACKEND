import express from 'express';
import {
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    loginCliente               // ← Controlador de login para clientes
} from '../controllers/clientesController.js';
import { verificarToken } from '../middleware/Auth.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/clientes)
// ==============================================

router.get('/obtener', verificarToken, obtenerClientes);
router.get('/buscar/:id', verificarToken, obtenerClientePorId);
router.post('/login', loginCliente);               // ← Ruta pública de login
router.post('/insertar', crearCliente);            // ← Registro público
router.put('/actualizar/:id', verificarToken, actualizarCliente);
router.delete('/eliminar/:id', verificarToken, eliminarCliente);

// ==============================================
// Documentación Swagger (summaries cortos)
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
 *     summary: Crear cliente
 *     tags: [Clientes]
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
 *               - password        // Añadido porque login requiere contraseña
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
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
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
 *     summary: Iniciar sesión
 *     tags: [Clientes]
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