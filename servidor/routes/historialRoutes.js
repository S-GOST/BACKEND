import express from 'express';
import {
    obtenerHistorial,
    obtenerHistorialPorId,
    crearHistorial,
    actualizarHistorial,
    eliminarHistorial
} from '../controllers/historialControllerjs';

const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/historial)
// ==============================================

// Listar todos los registros del historial
router.get('/obtener', obtenerHistorial);

// Buscar un registro específico por su ID
router.get('/buscar/:id', obtenerHistorialPorId);

// Insertar un nuevo registro al historial
router.post('/insertar', crearHistorial);

// Actualizar un registro existente
router.put('/actualizar/:id', actualizarHistorial);

// Eliminar un registro del historial
router.delete('/eliminar/:id', eliminarHistorial);

// ==============================================
// Documentación Swagger: Historial
// ==============================================

/**
 * @swagger
 * tags:
 * name: Historial
 * description: Registro histórico de eventos y actividades (IDs tipo texto)
 */

/**
 * @swagger
 * /api/historial/obtener:
 * get:
 * summary: Listar historial
 * tags: [Historial]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lista de eventos del historial
 * 401:
 * description: No autorizado
 */

/**
 * @swagger
 * /api/historial/buscar/{id}:
 * get:
 * summary: Buscar registro
 * tags: [Historial]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: ID del registro histórico
 * responses:
 * 200:
 * description: Registro encontrado
 * 404:
 * description: No encontrado
 */

/**
 * @swagger
 * /api/historial/insertar:
 * post:
 * summary: Crear registro
 * tags: [Historial]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - id
 * - fecha
 * - accion
 * - entidadId
 * properties:
 * id:
 * type: string
 * fecha:
 * type: string
 * format: date-time
 * accion:
 * type: string
 * description: Ejemplo (Creación, Modificación, Eliminación)
 * descripcion:
 * type: string
 * entidadId:
 * type: string
 * description: ID del objeto afectado (técnico, comprobante, etc.)
 * usuarioId:
 * type: string
 * description: ID del usuario que realizó la acción
 * responses:
 * 201:
 * description: Registro de historial creado
 * 400:
 * description: Datos inválidos
 */

/**
 * @swagger
 * /api/historial/actualizar/{id}:
 * put:
 * summary: Actualizar registro
 * tags: [Historial]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * accion:
 * type: string
 * descripcion:
 * type: string
 * fecha:
 * type: string
 * format: date-time
 * responses:
 * 200:
 * description: Registro actualizado
 * 404:
 * description: No encontrado
 */

/**
 * @swagger
 * /api/historial/eliminar/{id}:
 * delete:
 * summary: Eliminar registro
 * tags: [Historial]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Registro eliminado
 * 404:
 * description: No encontrado
 */

export default router;