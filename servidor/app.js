import express from "express";// Importamos Express para crear nuestro servidor y manejar las rutas. Express es un framework de Node.js que facilita la creación de aplicaciones web y APIs. Nos permite definir rutas, manejar solicitudes HTTP, y gestionar middleware de manera sencilla. Al importar Express, podemos utilizar sus funcionalidades para configurar nuestro servidor, definir endpoints para nuestras rutas, y gestionar la lógica de negocio de nuestra aplicación. En este caso, estamos utilizando Express para crear un servidor que manejará las rutas relacionadas con administradores, servicios y productos en nuestra aplicación.
import Admins from "./routes/adminRoutes.js"; 
import Servicio from "./routes/serviciosRoutes.js";
import Productos from "./routes/productosRoutes.js"; // Revisa que el nombre del archivo sea exacto
import Tecnicos from "./routes/tecnicoRoutes.js";
import Clientes from "./routes/clientesRoutes.js";
import OrdenServicio from "./routes/ordenServicioRoutes.js";
import DetalleOrdenServicio from "./routes/detalleOrdenServicioRoutes.js";
import Motos from "./routes/motosRoutes.js";
import cors from "cors";// Importamos el middleware CORS para permitir solicitudes desde diferentes orígenes, lo cual es especialmente útil cuando el frontend y el backend están alojados en dominios diferentes. Al usar CORS, podemos configurar qué orígenes tienen permiso para acceder a los recursos de nuestro servidor, lo que mejora la seguridad y la flexibilidad de nuestra aplicación. En este caso, al importar y usar CORS en nuestra aplicación Express, estamos permitiendo que cualquier origen pueda realizar solicitudes a nuestro servidor, lo que es útil durante el desarrollo y pruebas. Sin embargo, en un entorno de producción, es recomendable configurar CORS de manera más restrictiva para limitar el acceso solo a los orígenes confiables.    
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
const app = express();



app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));//

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas base
app.use("/api/admins", Admins);
app.use("/api/servicios", Servicio);
app.use("/api/productos", Productos); 
app.use("/api/tecnicos", Tecnicos);
app.use("/api/clientes", Clientes);
app.use("/api/ordenes_servicio", OrdenServicio); 
app.use("/api/detalles_orden_servicio", DetalleOrdenServicio);
app.use("/api/motos", Motos);

// (Manejo de errores )
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


export default app; // <--- ¡ESTA ES LA LÍNEA QUE FALTA!