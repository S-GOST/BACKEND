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

export default router;