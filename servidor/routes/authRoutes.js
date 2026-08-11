import express from 'express';
import bcrypt from 'bcrypt';
import Usuario from '../models/usuarioModel.js';
import { generarTokens, setRefreshTokenCookie, renovarToken, logout } from '../middleware/refreshToken.js';
import { limiterLogin } from '../middleware/rateLimiter.js';
import { validarLogin } from '../middleware/validar.js';
import { obtenerCsrfToken } from '../middleware/csrf.js';
import crypto from 'crypto';
import { enviarCorreoRecuperacion } from '../utils/mailer.js';
import { logHistory } from '../utils/historyLogger.js';

const router = express.Router();

// ============================================================
// POST /api/auth/login — Login universal con rate limiting + validación
// ============================================================
router.post('/login', limiterLogin, validarLogin, async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: true, mensaje: 'Usuario y contraseña requeridos' });
  }
  try {
    // RFN-001: Usar findOneWithPassword (nunca exponer password en respuestas)
    const user = await Usuario.findOneWithPassword({ where: { usuario } });
    if (!user) {
      return res.status(401).json({ error: true, mensaje: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: true, mensaje: 'Credenciales inválidas' });
    }

    // RFN-002: Generar accessToken (1h) + refreshToken (24h)
    const { accessToken, refreshToken } = generarTokens(user);

    // Setear refreshToken como cookie httpOnly
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      token: accessToken,
      rol: user.id_rol,
      nombre: user.nombre,
      id_usuario: user.id_usuario
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: true, mensaje: 'Error interno del servidor' });
  }
});

// ============================================================
// POST /api/auth/refresh — Renovar access token con refresh token
// ============================================================
router.post('/refresh', renovarToken);

// ============================================================
// POST /api/auth/logout — Cerrar sesión (invalidar refresh token)
// ============================================================
router.post('/logout', logout);

// ============================================================
// GET /api/auth/csrf-token — Obtener token CSRF fresco
// ============================================================
router.get('/csrf-token', obtenerCsrfToken);

// ============================================================
// POST /api/auth/forgot-password — Solicitar recuperación de contraseña
// ============================================================
router.post('/forgot-password', async (req, res) => {
  const { correo } = req.body;
  if (!correo) {
    return res.status(400).json({ error: true, mensaje: 'Correo electrónico requerido' });
  }

  try {
    const user = await Usuario.findOne({ where: { correo } });
    
    // Para no dar información sobre qué correos existen, siempre devolvemos éxito.
    // Solo enviamos el correo si el usuario existe.
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      // Fecha de expiración (24 horas)
      const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await Usuario.setResetToken(correo, token, expiracion);
      await enviarCorreoRecuperacion(correo, token);
    }

    return res.json({ success: true, mensaje: 'Si el correo está registrado, recibirá un enlace de recuperación' });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return res.status(500).json({ error: true, mensaje: 'Error procesando la solicitud' });
  }
});

// ============================================================
// POST /api/auth/reset-password — Restablecer la contraseña
// ============================================================
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: true, mensaje: 'Token y contraseña requeridos' });
  }

  try {
    const user = await Usuario.findByResetToken(token);

    if (!user) {
      return res.status(400).json({ error: true, mensaje: 'Token inválido o expirado' });
    }

    // FA-07 / RN-003: Validar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: true, mensaje: 'La nueva contraseña debe ser diferente a la actual' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    await Usuario.updatePassword(user.numero_documento, passwordHash);

    // Auditoría
    await logHistory(
      user.id_usuario,
      'usuarios',
      user.numero_documento,
      'UPDATE',
      `Se restableció la contraseña mediante correo electrónico`
    );

    return res.json({ success: true, mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return res.status(500).json({ error: true, mensaje: 'Error al restablecer contraseña' });
  }
});

export default router;
