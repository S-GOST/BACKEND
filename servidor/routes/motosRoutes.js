import express from 'express';
import { 
    obtenerMotos, 
    obtenerMotoPorId, 
    crearMoto, 
    actualizarMoto, 
    eliminarMoto 
} from '../controllers/motosController.js';

const router = express.Router();

// Rutas para la gestión de motos
router.get('/obtener', obtenerMotos);
router.get('/buscar/:id', obtenerMotoPorId);
router.post('/insertar', crearMoto);
router.put('/actualizar/:id', actualizarMoto);
router.delete('/eliminar/:id', eliminarMoto);

export default router;