import crypto from 'crypto';

// ============================================================
// RFN-005: Protección CSRF — Patrón Double Submit Cookie
// ============================================================
// Cómo funciona:
// 1. El servidor genera un token CSRF y lo envía como cookie 'XSRF-TOKEN'
// 2. El frontend lee esa cookie y la envía como header 'X-CSRF-Token' en cada POST/PUT/DELETE
// 3. El servidor compara ambos valores — si no coinciden, rechaza la petición
//
// En el frontend (axios):
//   axios.defaults.withCredentials = true;
//   // axios lee automáticamente la cookie XSRF-TOKEN y la envía como header X-XSRF-TOKEN

// Generar token CSRF y enviarlo como cookie
export const generarCsrfToken = (req, res, next) => {
    // Si ya existe una cookie CSRF válida, no regenerar
    if (req.cookies && req.cookies['XSRF-TOKEN']) {
        return next();
    }

    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,   // El frontend JS necesita leerlo para enviarlo como header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
    next();
};

// Validar CSRF en peticiones que modifican datos (POST/PUT/DELETE)
export const validarCsrf = (req, res, next) => {
    // Métodos seguros no necesitan CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Rutas excluidas de validación CSRF (Login, Refresh, Registro de Cliente)
    const rutasExcluidas = ['/api/auth/login', '/api/auth/refresh', '/api/clientes/insertar'];
    if (rutasExcluidas.includes(req.path)) {
        return next();
    }

    const cookieToken = req.cookies?.['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

    if (!cookieToken || !headerToken) {
        // En producción se bloquea; en desarrollo se permite con warning
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Token CSRF no proporcionado'
            });
        }
        console.warn(`[CSRF] Bypass en desarrollo: ${req.method} ${req.path}`);
        return next();
    }

    if (cookieToken !== headerToken) {
        console.warn(`CSRF Rechazado en ${req.path}: Tokens no coinciden`);
        return res.status(403).json({
            success: false,
            message: 'Token CSRF inválido'
        });
    }

    next();
};

// Endpoint para obtener un token CSRF fresco
// GET /api/auth/csrf-token
export const obtenerCsrfToken = (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ success: true, csrfToken: token });
};
