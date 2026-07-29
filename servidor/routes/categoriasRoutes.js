import express from 'express';
import {
    obtenerCategorias,
    obtenerCategoriaPorId,
    obtenerCategoriasPorTipo,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} from '../controllers/categoriasController.js';
import { verificarToken } from '../middleware/Auth.js';
import { autorizar } from '../middleware/autorizar.js';
import { validarCategoria } from '../middleware/validar.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/categorias)
// ==============================================

// Todos los roles pueden leer
router.get('/obtener', verificarToken, autorizar(1, 2, 3), obtenerCategorias);
router.get('/buscar/:id', verificarToken, autorizar(1, 2, 3), obtenerCategoriaPorId);
router.get('/tipo/:tipo', verificarToken, autorizar(1, 2, 3), obtenerCategoriasPorTipo);

// Solo Admin puede crear, actualizar o eliminar
router.post('/insertar', verificarToken, autorizar(1), validarCategoria, crearCategoria);
router.put('/actualizar/:id', verificarToken, autorizar(1), validarCategoria, actualizarCategoria);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarCategoria);

// ==============================================
// Documentación Swagger
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Gestión de categorías de productos y servicios
 */

/**
 * @swagger
 * /api/categorias/obtener:
 *   get:
 *     summary: Listar categorías
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida
 */

/**
 * @swagger
 * /api/categorias/buscar/{id}:
 *   get:
 *     summary: Buscar categoría por ID
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /api/categorias/tipo/{tipo}:
 *   get:
 *     summary: Buscar categorías por tipo
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PRODUCTO, SERVICIO]
 *         description: Tipo de categoría (PRODUCTO o SERVICIO)
 *     responses:
 *       200:
 *         description: Categorías encontradas
 */

/**
 * @swagger
 * /api/categorias/insertar:
 *   post:
 *     summary: Crear categoría
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [PRODUCTO, SERVICIO]
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/categorias/actualizar/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [PRODUCTO, SERVICIO]
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /api/categorias/eliminar/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       404:
 *         description: No encontrada
 */

export default router;
