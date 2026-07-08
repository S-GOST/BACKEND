import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuarioModel.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: true, mensaje: 'Usuario y contraseña requeridos' });
  }
  try {
    const user = await Usuario.findOne({ where: { usuario } });
    if (!user) {
      return res.status(401).json({ error: true, mensaje: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: true, mensaje: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { id_usuario: user.numero_documento, rol: user.id_rol },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '1h' }
    );
    return res.json({ token, rol: user.id_rol, nombre: user.nombre });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: true, mensaje: 'Error interno del servidor' });
  }
});

export default router;
