import express from 'express';
import {
    obtenerInformes,
    obtenerMisInformes,
    obtenerInformePorId,
    crearInforme,
    actualizarInforme,
    eliminarInforme,
    generarReporte,
    obtenerProductividadTecnicos,
    obtenerReporteInventario
} from '../controllers/informeController.js';
import { verificarToken } from "../middleware/Auth.js";
import { autorizar } from "../middleware/autorizar.js";
import { validarPeriodoReporte, validarInforme } from "../middleware/validar.js";

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/informes)
// ==============================================

router.get('/obtener', verificarToken, autorizar(1), obtenerInformes);
router.get('/mis-informes', verificarToken, autorizar(2), obtenerMisInformes);
router.get('/buscar/:id', verificarToken, autorizar(1, 2), obtenerInformePorId);
router.post('/insertar', verificarToken, autorizar(1, 2), validarInforme, crearInforme);
router.put('/actualizar/:id', verificarToken, autorizar(1, 2), validarInforme, actualizarInforme);
router.delete('/eliminar/:id', verificarToken, autorizar(1), eliminarInforme);

// HU-004.1: Generar reporte por periodo (Admin = global, Técnico = solo suyo)
router.post('/generar-reporte', verificarToken, autorizar(1, 2), validarPeriodoReporte, generarReporte);

// RF-0036: Productividad de Tecnicos
router.get('/productividad', verificarToken, autorizar(1), obtenerProductividadTecnicos);

// RF-0035: Inventario de Productos y Servicios
router.get('/inventario', verificarToken, autorizar(1, 2), obtenerReporteInventario);



// ==============================================
// Documentación Swagger: Informes 
// ==============================================

/**
 * @swagger
 * tags:
 *   - name: Informes
 *     description: Gestión de informes técnicos y resultados (IDs tipo texto)
 */

/**
 * @swagger
 * /api/informes/obtener:
 *   get:
 *     summary: Listar informes
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de informes obtenida
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/informes/buscar/{id}:
 *   get:
 *     summary: Buscar informe
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del informe (varchar)
 *     responses:
 *       200:
 *         description: Informe encontrado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/informes/insertar:
 *   post:
 *     summary: Crear informe
 *     tags: [Informes]
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
 *               - fecha
 *               - contenido
 *               - tecnicoId
 *             properties:
 *               id:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date
 *               contenido:
 *                 type: string
 *                 description: Detalle técnico del informe
 *               tecnicoId:
 *                 type: string
 *               servicioId:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Informe creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/informes/actualizar/{id}:
 *   put:
 *     summary: Actualizar informe
 *     tags: [Informes]
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
 *               contenido:
 *                 type: string
 *               observaciones:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Informe actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/informes/eliminar/{id}:
 *   delete:
 *     summary: Eliminar informe
 *     tags: [Informes]
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
 *         description: Informe eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

export default router;