import express from 'express';
import {
  obtenerDetallesOrden,
  obtenerDetalleOrdenPorId,
  crearDetalleOrden,
  actualizarDetalleOrden,
  eliminarDetalleOrden
} from '../controllers/detalleOrdenServicioController.js';

const router = express.Router();

router.get('/obtener', obtenerDetallesOrden);
router.get('/buscar/:id', obtenerDetalleOrdenPorId);
router.post('/insertar', crearDetalleOrden);
router.put('/actualizar', actualizarDetalleOrden);
router.put('/actualizar/:id', actualizarDetalleOrden);
router.delete('/eliminar/:id', eliminarDetalleOrden);

export default router;
