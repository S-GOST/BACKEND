import clientes from "../models/clientesModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginCliente = async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    const cliente = await clientes.findOne({ where: { usuario } });

    if (!cliente) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const esValida = await bcrypt.compare(contrasena, cliente.contrasena);

    if (!esValida) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: cliente.ID_CLIENTES },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true,
      id: cliente.ID_CLIENTES,
      token,
      nombre: cliente.Nombre,
      rol: 'cliente'
    });
  } catch (error) {
    console.error("Error en el login de cliente:", error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const obtenerClientes = async (req, res) => {
  try {
    const data = await clientes.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerClientePorId = async (req, res) => {
  const { id } = req.params;
  try {
    const cliente = await clientes.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    res.json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const nuevoCliente = await clientes.create(req.body);
    res.json({ success: true, data: nuevoCliente });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  const id = req.params.id || req.body.ID_CLIENTES;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID_CLIENTES es requerido' });
  }

  try {
    const resultado = await clientes.update(id, req.body);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const eliminarCliente = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID_CLIENTES es requerido' });
  }

  try {
    await clientes.delete(id);
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};