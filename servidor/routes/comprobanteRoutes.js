import express from 'express';
import { 
    obtenerComprobantes, 
    obtenerComprobantePorId, 
    crearComprobante, 
    actualizarComprobante, 
    eliminarComprobante 
} from '../controllers/comprobanteController.js';

const router = express.Router();

// Rutas para la gestión de comprobantes
router.get('/obtener', obtenerComprobantes);
router.get('/buscar/:id', obtenerComprobantePorId);
router.post('/insertar', crearComprobante);
router.put('/actualizar/:id', actualizarComprobante);
router.delete('/eliminar/:id', eliminarComprobante);

export default router;