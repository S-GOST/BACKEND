import { body, validationResult } from 'express-validator';
import fs from 'fs';

// ============================================================
// RFN-003: Validación y Sanitización de Datos
// ============================================================

// Middleware que procesa los errores de validación
const manejarErrores = (req, res, next) => {
    const errores = validationResult(req); if (!errores.isEmpty()) fs.writeFileSync('validation_error.json', JSON.stringify({errores: errores.array(), body: req.body}, null, 2));
    if (!errores.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errores: errores.array().map(e => ({
                campo: e.path,
                mensaje: e.msg
            }))
        });
    }
    next();
};

// -------------------------------------------------------
// Validación de Login
// -------------------------------------------------------
export const validarLogin = [
    body('usuario')
        .trim()
        .notEmpty().withMessage('El usuario es requerido')
        .isLength({ max: 100 }).withMessage('El usuario no puede exceder 100 caracteres')
        .escape(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ max: 100 }).withMessage('La contraseña no puede exceder 100 caracteres'),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Registro de Cliente (ruta pública)
// -------------------------------------------------------
export const validarRegistroCliente = [
    body('numero_documento')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido')
        .isNumeric().withMessage('El número de documento debe contener solo dígitos')
        .isLength({ min: 6, max: 20 }).withMessage('El número de documento debe tener entre 6 y 20 dígitos'),
    body('id_tipo_documento')
        .notEmpty().withMessage('El tipo de documento es requerido')
        .isInt({ min: 1 }).withMessage('El tipo de documento debe ser un número válido'),
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres')
        .escape(),
    body('usuario')
        .trim()
        .notEmpty().withMessage('El usuario es requerido')
        .isLength({ max: 100 }).withMessage('El usuario no puede exceder 100 caracteres')
        .escape(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos'),
    body('correo')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El formato del correo no es válido (RFC 5322)')
        .isLength({ max: 100 }).withMessage('El correo no puede exceder 100 caracteres')
        .normalizeEmail(),
    body('telefono')
        .trim()
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^\+?[0-9\s\-]+$/).withMessage('El teléfono solo puede contener números, espacios, guiones y el prefijo +')
        .isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres')
        .escape(),
    body('ciudad')
        .trim()
        .notEmpty().withMessage('La ciudad es requerida')
        .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres')
        .escape(),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Creación/Actualización de Usuario (admin/técnico)
// -------------------------------------------------------
export const validarUsuario = [
    body('numero_documento')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido')
        .isNumeric().withMessage('El número de documento debe contener solo dígitos')
        .isLength({ min: 6, max: 20 }).withMessage('El número de documento debe tener entre 6 y 20 dígitos'),
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres')
        .escape(),
    body('usuario')
        .trim()
        .notEmpty().withMessage('El usuario es requerido')
        .isLength({ max: 100 }).withMessage('El usuario no puede exceder 100 caracteres')
        .escape(),
    body('correo')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El formato del correo no es válido')
        .isLength({ max: 100 }).withMessage('El correo no puede exceder 100 caracteres')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos'),
    body('telefono')
        .trim()
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^\+?[0-9\s\-]+$/).withMessage('El teléfono solo puede contener números, espacios, guiones y el prefijo +')
        .isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres')
        .escape(),
    manejarErrores
];


// -------------------------------------------------------
// Validación de Categorías
// -------------------------------------------------------
export const validarCategoria = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la categoría es requerido')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres')
        .escape(),
    body('tipo')
        .trim()
        .notEmpty().withMessage('El tipo es requerido')
        .isIn(['PRODUCTO', 'SERVICIO']).withMessage('El tipo debe ser PRODUCTO o SERVICIO'),
    body('descripcion')
        .trim()
        .notEmpty().withMessage('La descripción es requerida')
        .isLength({ max: 100 }).withMessage('La descripción no puede exceder 100 caracteres')
        .escape(),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Servicios
// -------------------------------------------------------
export const validarServicio = [
    body('Nombre')
        .trim()
        .notEmpty().withMessage('El nombre del servicio es requerido')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres')
        .escape(),
    body('Precio')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a cero'),
    body('ID_CATEGORIA')
        .notEmpty().withMessage('El servicio debe estar asociado a una categoría'),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Productos
// -------------------------------------------------------
export const validarProducto = [
    body('Nombre')
        .trim()
        .notEmpty().withMessage('El nombre del producto es requerido')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres')
        .escape(),
    body('precio_venta')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a cero'),
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a cero'),
    body('ID_CATEGORIA')
        .notEmpty().withMessage('El producto debe estar asociado a una categoría'),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Motos
// -------------------------------------------------------
export const normalizarMoto = (req, res, next) => {
    if (req.body) {
        req.body.placa = req.body.placa || req.body.Placa;
        req.body.marca = req.body.marca || req.body.Marca;
        req.body.modelo = req.body.modelo || req.body.Modelo;
        req.body.cilindraje = req.body.cilindraje || req.body.Cilindraje;
        req.body.kilometraje = req.body.kilometraje || req.body.Kilometraje || req.body.Recorrido;
        req.body.id_cliente = req.body.id_cliente || req.body.ID_CLIENTES || req.body.ID_CLIENTE;
    }
    next();
};

export const validarMoto = [
    normalizarMoto,
    body('placa')
        .trim().notEmpty().withMessage('La placa es requerida')
        .isLength({ max: 100 }).withMessage('La placa no puede exceder 100 caracteres'),
    body('marca')
        .trim().notEmpty().withMessage('La marca es requerida')
        .isLength({ max: 100 }).withMessage('La marca no puede exceder 100 caracteres'),
    body('modelo')
        .notEmpty().withMessage('El modelo (año) es requerido')
        .isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('El año debe ser válido (>= 1900 y no futuro)'),
    body('cilindraje')
        .notEmpty().withMessage('El cilindraje es requerido')
        .isNumeric().withMessage('El cilindraje debe ser numérico'),
    body('kilometraje')
        .notEmpty().withMessage('El kilometraje es requerido')
        .isNumeric().withMessage('El kilometraje debe ser numérico'),
    body('id_cliente')
        .notEmpty().withMessage('El cliente asociado es requerido'),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Órdenes de Servicio
// -------------------------------------------------------
export const validarOrden = [
    // RN-002: La fecha de la orden no puede ser futura
    body('fecha_ingreso')
        .optional() // Si no viene, el backend le pone la fecha actual
        .isISO8601().withMessage('La fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)')
        .custom((value) => {
            const fechaIngreso = new Date(value);
            const hoy = new Date();
            if (fechaIngreso > hoy) {
                throw new Error('La fecha de ingreso no puede ser futura');
            }
            return true;
        }),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Detalles de Orden de Servicio
// -------------------------------------------------------
export const validarDetalleOrden = [
    body('cantidad')
        .notEmpty().withMessage('La cantidad es requerida')
        .isNumeric().withMessage('La cantidad debe ser numérica')
        .custom((value) => {
            if (value <= 0) {
                throw new Error('La cantidad debe ser mayor a cero'); // CA-009
            }
            return true;
        }),
    // CA-010: Campos obligatorios de servicio o producto
    body().custom((value, { req }) => {
        const hasServicio = req.body.ID_SERVICIOS !== undefined && req.body.ID_SERVICIOS !== null && req.body.ID_SERVICIOS !== '';
        const hasProducto = req.body.ID_PRODUCTOS !== undefined && req.body.ID_PRODUCTOS !== null && req.body.ID_PRODUCTOS !== '';
        if (!hasServicio && !hasProducto) {
            throw new Error('El detalle debe tener al menos un servicio o producto seleccionado');
        }
        return true;
    }),
    manejarErrores
];
// -------------------------------------------------------
// Validación de Reportes de Informes (HU-004.1)
// -------------------------------------------------------
export const validarPeriodoReporte = [
    body('fecha_inicio')
        .notEmpty().withMessage('La fecha de inicio es requerida')
        .isISO8601().withMessage('La fecha de inicio debe tener formato YYYY-MM-DD'),
    body('fecha_fin')
        .notEmpty().withMessage('La fecha fin es requerida')
        .isISO8601().withMessage('La fecha fin debe tener formato YYYY-MM-DD')
        .custom((value, { req }) => {
            const fechaFin = new Date(value);
            const fechaInicio = new Date(req.body.fecha_inicio);
            const hoy = new Date();
            
            // RN-002: La fecha final no puede ser mayor a la fecha actual
            if (fechaFin > hoy) {
                throw new Error('La fecha final no puede ser futura');
            }

            // RN-001: El período no puede ser mayor a 1 año
            const diffTime = Math.abs(fechaFin - fechaInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays > 365) {
                throw new Error('El período de consulta no puede ser mayor a 1 año');
            }

            if (fechaInicio > fechaFin) {
                throw new Error('La fecha de inicio no puede ser mayor a la fecha final');
            }
            
            return true;
        }),
    manejarErrores
];

// -------------------------------------------------------
// Validación de Campos de Informe (HU-004.1)
// -------------------------------------------------------
export const validarInforme = [
    body('diagnostico')
        .trim()
        .notEmpty().withMessage('El diagnóstico es requerido')
        .isLength({ max: 1000 }).withMessage('El diagnóstico no puede exceder 1000 caracteres')
        .escape(),
    body('trabajo_realizado')
        .trim()
        .notEmpty().withMessage('El trabajo realizado es requerido')
        .isLength({ max: 1000 }).withMessage('El trabajo realizado no puede exceder 1000 caracteres')
        .escape(),
    body('recomendaciones')
        .trim()
        .notEmpty().withMessage('Las recomendaciones son requeridas')
        .isLength({ max: 1000 }).withMessage('Las recomendaciones no pueden exceder 1000 caracteres')
        .escape(),
    manejarErrores
];
