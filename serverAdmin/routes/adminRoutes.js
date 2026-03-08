import express from 'express';
import { obtenerAdmins,obtenerAdminPorId, crearAdmin, eliminarAdmin, actualizarAdmin } from '../controllers/adminController.js';

const router = express.Router();

router.get('/obtener', obtenerAdmins);
router.get('/buscar/:id', obtenerAdminPorId);
router.post('/insertar', crearAdmin);
router.put('/actualizar/:id', actualizarAdmin);
router.delete('/eliminar/:id', eliminarAdmin);

export default router;