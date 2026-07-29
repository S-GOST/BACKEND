// ============================================================
// RFN-002: Autorización por Roles
// ============================================================
// Roles: 1 = Admin, 2 = Técnico, 3 = Cliente
//
// Uso en rutas:
//   router.get('/ruta', verificarToken, autorizar(1), handler)       → Solo admin
//   router.get('/ruta', verificarToken, autorizar(1, 2), handler)    → Admin + Técnico
//   router.get('/ruta', verificarToken, autorizar(1, 2, 3), handler) → Todos los roles

export const autorizar = (...rolesPermitidos) => {
    return (req, res, next) => {
        // verificarToken debe haberse ejecutado antes y haber seteado req.user
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};
