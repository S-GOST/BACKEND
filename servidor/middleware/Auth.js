import jwt from 'jsonwebtoken';

// ============================================================
// RFN-002: Verificación de Token JWT
// ============================================================

export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No hay token de acceso, permiso denegado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Unificamos en req.user con el payload estándar:
        // { id_usuario, numero_documento, rol }
        req.user = {
            id_usuario: decoded.id_usuario,
            numero_documento: decoded.numero_documento,
            rol: decoded.rol
        };

        // Mantener req.admin para compatibilidad temporal
        req.admin = req.user;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado, renueva tu sesión'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Token no válido'
        });
    }
};
