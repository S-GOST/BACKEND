import Administrador from "../models/adminModel.js";
import pool from "../config/db.js";
import bcrypt from "bcrypt"; // ¡IMPORTANTE! Faltaba esta importación
import jwt from "jsonwebtoken"; // ¡IMPORTANTE! Faltaba esta importación

export const loginAdmin = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        // Usamos 'pool' porque así lo importaste arriba
        const [rows] = await pool.query('SELECT * FROM administradores WHERE usuario = ?', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const admin = rows[0];
        
        // Comparamos la contraseña plana con el hash de la base de datos
        const esValida = await bcrypt.compare(contrasena, admin.contrasena);

        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        // Genera el token. Asegúrate de tener JWT_SECRET en tu .env
        const token = jwt.sign(
            { id: admin.ID_ADMINISTRADOR }, 
            process.env.JWT_SECRET || 'clave_secreta_temporal', 
            { expiresIn: '2h' }
        );

        // Devolvemos la estructura exacta que espera tu Frontend
        res.json({ 
            success: true, 
            token, 
            nombre: admin.Nombre 
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const obtenerAdmins = async (req, res) => {
    try {
        const admins = await Administrador.findAll();
        // Ajustamos para que coincida con lo que busca tu componente Admins.tsx (res.data.data)
        res.json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerAdminPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await Administrador.findByPk(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
        }
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearAdmin = async (req, res) => {
    try {
        const nuevoAdmin = await Administrador.create(req.body);    
        res.json({ success: true, data: nuevoAdmin });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const adminActualizado = await Administrador.update(id, req.body);  
        res.json({ success: true, data: adminActualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }   
};

export const eliminarAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        await Administrador.delete(id);
        res.json({ success: true, message: 'Administrador eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

