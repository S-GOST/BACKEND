import express from 'express'; 
import { 
    obtenerOrdenes, 
    obtenerOrdenPorId, 
    crearOrden, 
    actualizarOrden, 
    eliminarOrden
} from '../controllers/ordenServicioController.js';

const router = express.Router(); 

// 1. Obtener todas las órdenes de servicio
router.get('/obtener', obtenerOrdenes); 

// 2. Buscar orden de servicio por ID
router.get('/buscar/:id', obtenerOrdenPorId); 

// 3. Insertar una nueva orden de servicio
router.post('/insertar', crearOrden); 

// 4. Actualizar orden de servicio existente
router.put('/actualizar', actualizarOrden); 
router.put('/actualizar/:id', actualizarOrden); 

// 5. Eliminar una orden de servicio
router.delete('/eliminar/:id', eliminarOrden); 

export default router; 
