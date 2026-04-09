import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    // Permitir rutas de solo lectura sin token para desarrollo
    if (req.path.endsWith('/obtener') || req.path.includes('/buscar/')) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No hay token, permiso denegado" });
    }

try {
    const cifrado = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_temporal');
    req.admin = cifrado;
    next();
} catch (error) {
    res.status(403).json({ success: false, message: "Token no válido o expirado" });
}
};
