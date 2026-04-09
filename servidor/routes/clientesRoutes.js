import express from 'express';
import { 
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  eliminarCliente,
  actualizarCliente,
  loginCliente
} from '../controllers/clientesController.js';
import { verificarToken } from "../middleware/Auth.js";

const router = express.Router();

router.get('/obtener', verificarToken, obtenerClientes);
router.get('/buscar/:id', verificarToken, obtenerClientePorId);
router.post('/login', loginCliente);
router.post('/insertar', verificarToken, crearCliente);
router.put('/actualizar', verificarToken, actualizarCliente);
router.put('/actualizar/:id', verificarToken, actualizarCliente);
router.delete('/eliminar/:id', verificarToken, eliminarCliente);

export default router;
