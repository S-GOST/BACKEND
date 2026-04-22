import express from 'express';
import {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerStockBajo
} from '../controllers/productosController.js';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/productos)
// ==============================================

router.get('/obtener', obtenerProductos);
router.get('/buscar/:id', obtenerProductoPorId);
router.post('/insertar', crearProducto);
router.put('/actualizar/:id', actualizarProducto);
router.delete('/eliminar/:id', eliminarProducto);
router.get('/stock-bajo', obtenerStockBajo);

// ==============================================
// Documentación Swagger (summaries cortos, IDs string)
// ==============================================

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos (IDs tipo texto)
 */

/**
 * @swagger
 * /api/productos/obtener:
 *   get:
 *     summary: Listar productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos obtenida
 */

/**
 * @swagger
 * /api/productos/buscar/{id}:
 *   get:
 *     summary: Buscar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto (varchar)
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/productos/insertar:
 *   post:
 *     summary: Crear producto
 *     tags: [Productos]
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
 *               - stock
 *             properties:
 *               id:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoria:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/productos/actualizar/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
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
 *               stock:
 *                 type: integer
 *               categoria:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/productos/eliminar/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
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
 *         description: Producto eliminado
 *       404:
 *         description: No encontrado
 */

export default router;