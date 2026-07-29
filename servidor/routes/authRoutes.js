import express from 'express';
import bcrypt from 'bcrypt';
import Usuario from '../models/usuarioModel.js';
import { generarTokens, setRefreshTokenCookie, renovarToken, logout } from '../middleware/refreshToken.js';
import { limiterLogin } from '../middleware/rateLimiter.js';
import { validarLogin } from '../middleware/validar.js';
import { obtenerCsrfToken } from '../middleware/csrf.js';

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

export default router;
