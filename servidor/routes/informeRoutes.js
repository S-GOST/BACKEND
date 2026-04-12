import express from 'express';
import {
    obtenerInformes,
    obtenerInformePorId,
    crearInforme,
    actualizarInforme,
    eliminarInforme
} from '../controllers/informeControllerjs';
const router = express.Router();

// ==============================================
// Rutas (montadas sobre /api/informes)
// ==============================================

router.get('/obtener', obtenerInformes);
router.get('/buscar/:id', obtenerInformePorId);
router.post('/insertar', crearInforme);
router.put('/actualizar/:id', actualizarInforme);
router.delete('/eliminar/:id', eliminarInforme);

export default router;