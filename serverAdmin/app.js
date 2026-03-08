import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors";

const app = express();

// Middleware para parsear JSON (ya viene incluido en express, no necesitas body-parser)
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Rutas base
app.use("/api/admins", adminRoutes);                        

// Manejo de errores 404 global
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

export default app;