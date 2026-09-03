import jwt from 'jsonwebtoken';

// ============================================================
// RFN-002: Refresh Token — Renovación automática de sesión
// ============================================================

/**
 * Genera el par accessToken + refreshToken
 * @param {Object} usuario - Datos del usuario desde la BD
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generarTokens = (usuario) => {
    const payload = {
        id_usuario: usuario.id_usuario,
        numero_documento: usuario.numero_documento ? usuario.numero_documento.toString() : null,
        rol: usuario.id_rol
    };

    // Access token: corta duración (1 hora)
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Refresh token: larga duración (24 horas máximo según RFN-002)
    const refreshToken = jwt.sign(
        { id_usuario: usuario.id_usuario },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '24h' }
    );

    return { accessToken, refreshToken };
};

/**
 * Configura la cookie del refreshToken en la respuesta
 * @param {Object} res - Response de Express
 * @param {string} refreshToken - El refresh token generado
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,     // No accesible desde JavaScript del cliente
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'Lax', // Prevenir envío en requests cross-site (Lax para desarrollo local)
        maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
        path: '/api/auth'   // Solo enviar en rutas de auth
    });
};

/**
 * Middleware para verificar y renovar el access token usando el refresh token
 */
export const renovarToken = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó refresh token'
        });
    }

    try {
        // Verificar el refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Importar el modelo dinámicamente para evitar dependencia circular
        const { default: Usuario } = await import('../models/usuarioModel.js');
        const usuario = await Usuario.findOneWithPassword({ where: { id_usuario: decoded.id_usuario } });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Generar nuevos tokens
        const tokens = generarTokens(usuario);

        // Setear nueva cookie del refresh token
        setRefreshTokenCookie(res, tokens.refreshToken);

        return res.json({
            success: true,
            token: tokens.accessToken,
            rol: usuario.id_rol,
            nombre: usuario.nombre,
            id_usuario: usuario.id_usuario
        });

    } catch (error) {
        // Limpiar cookie inválida
        res.clearCookie('refreshToken', { path: '/api/auth' });

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Sesión expirada, inicia sesión nuevamente'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Refresh token inválido'
        });
    }
};

/**
 * Endpoint para cerrar sesión (invalida el refresh token)
 */
export const logout = (req, res) => {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
};
