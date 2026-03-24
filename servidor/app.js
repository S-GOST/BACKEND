import express from "express"; 
import Admins from "./routes/adminRoutes.js"; 
import Servicio from "./routes/serviciosRoutes.js";
// 1. IMPORTA LAS RUTAS DE PRODUCTOS
import Productos from "./routes/productosRoutes.js"; // Revisa que el nombre del archivo sea exacto
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Rutas base
app.use("/api/admins", Admins);
app.use("/api/servicios", Servicio);
// 2. MONTA LAS RUTAS DE PRODUCTOS
app.use("/api/productos", Productos); 

// ... el resto de tu código (Manejo de errores 404)

export default app; // <--- ¡ESTA ES LA LÍNEA QUE FALTA!