import express from 'express';
import { 
    obtenerServicios, 
    obtenerServicioPorId, 
    crearServicio, 
    actualizarServicio, 
    eliminarServicio 
} from '../controllers/serviciosController.js';

const router = express.Router();

// Rutas para la gestión de servicios
router.get('/obtener', obtenerServicios);
router.get('/buscar/:id', obtenerServicioPorId);
router.post('/insertar', crearServicio);
router.put('/actualizar/:id', actualizarServicio);
router.delete('/eliminar/:id', eliminarServicio);

export default router;