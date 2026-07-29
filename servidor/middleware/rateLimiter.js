import rateLimit from 'express-rate-limit';

// ============================================================
// RFN-002: Rate Limiting — Protección contra brute force
// ============================================================

// Rate limit general: 1000 requests por IP cada 15 minutos (Ajustado para no bloquear en uso normal de dashboard/desarrollo)
export const limiterGeneral = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000,
    standardHeaders: true, // Enviar info de rate limit en headers `RateLimit-*`
    legacyHeaders: false,  // Deshabilitar headers `X-RateLimit-*`
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos'
    }
});

// Rate limit estricto para login: 100 intentos por IP cada 15 minutos (aumentado para facilitar pruebas en desarrollo)
export const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos'
    }
});
