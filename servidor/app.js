import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares de seguridad
import { limiterGeneral } from "./middleware/rateLimiter.js";
import { generarCsrfToken, validarCsrf } from "./middleware/csrf.js";

// Rutas
import Admins from "./routes/adminRoutes.js";
import Servicio from "./routes/serviciosRoutes.js";
import Productos from "./routes/productosRoutes.js";
import Tecnicos from "./routes/tecnicoRoutes.js";
import Clientes from "./routes/clientesRoutes.js";
import OrdenServicio from "./routes/ordenServicioRoutes.js";
import DetalleOrdenServicio from "./routes/detalleOrdenServicioRoutes.js";
import Motos from "./routes/motosRoutes.js";
import Informe from "./routes/informeRoutes.js";
import Comprobante from "./routes/comprobanteRoutes.js";
import Historial from "./routes/historialRoutes.js";
import AuthRoutes from "./routes/authRoutes.js";
import Categorias from "./routes/categoriasRoutes.js";
import TipoDocumento from "./routes/tipoDocumentoRoutes.js";

const app = express();

// ============================================================
// RFN-004: HTTPS — Headers de seguridad con Helmet
// ============================================================
// Incluye: HSTS, X-Frame-Options, X-Content-Type-Options, CSP, etc.
app.use(helmet());

// ============================================================
// RFN-004: Redirección HTTP → HTTPS (en producción detrás de proxy)
// ============================================================
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

// ============================================================
// CORS Restrictivo (RFN-004)
// ============================================================
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,  // Necesario para cookies (refreshToken + CSRF)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token']
}));

// ============================================================
// Rate Limiting General (RFN-002)
// ============================================================
app.use(limiterGeneral);

// ============================================================
// Parsers
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Necesario para refresh tokens y CSRF

// ============================================================
// RFN-005: Protección CSRF
// ============================================================
// Generar token CSRF en cada respuesta
app.use(generarCsrfToken);
// Validar CSRF en peticiones POST/PUT/DELETE
app.use(validarCsrf);

app.get("/", (_req, res) => {
  res.status(200).json({
    estado: "activo",
    mensaje: "API Backend en funcionamiento",
    documentacion: "/api-docs"
  });
});

// ============================================================
// Documentación API (Swagger) — Ruta pública
// ============================================================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================
// Rutas de la API
// ============================================================
app.use("/api/auth", AuthRoutes);
app.use("/api/admins", Admins);
app.use("/api/servicios", Servicio);
app.use("/api/productos", Productos);
app.use("/api/tecnicos", Tecnicos);
app.use("/api/clientes", Clientes);
app.use("/api/ordenes_servicio", OrdenServicio);
app.use("/api/detalles_orden_servicio", DetalleOrdenServicio);
app.use("/api/motos", Motos);
app.use("/api/informes", Informe);
app.use("/api/comprobantes", Comprobante);
app.use("/api/historial", Historial);
app.use("/api/categorias", Categorias);
app.use("/api/tipos-documento", TipoDocumento);

// ============================================================
// Manejo de errores
// ============================================================
app.use((req, res, next) => {
  res.status(404).json({
    error: true,
    mensaje: `La ruta ${req.originalUrl} no existe en este servidor.`
  });
});

app.use((err, req, res, next) => {
  console.error("Error en el servidor:", err.stack);
  res.status(500).json({
    error: true,
    mensaje: "Ocurrió un error interno en el servidor. Inténtalo más tarde."
  });
});


export default app; 