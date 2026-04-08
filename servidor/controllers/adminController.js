import Administrador from "../models/adminModel.js"; // Importamos el modelo 'Administrador' para poder utilizar sus métodos y realizar operaciones relacionadas con los administradores en la base de datos. Este modelo actúa como una capa de abstracción entre el controlador y la base de datos, permitiendo que el controlador se enfoque en la lógica de negocio mientras el modelo maneja las consultas SQL.    
import pool from "../config/db.js"; // Importamos el pool de conexiones a la base de datos para poder realizar consultas SQL directamente desde este controlador, especialmente para operaciones que no están cubiertas por los métodos del modelo 'Administrador', como el login que requiere una consulta específica para verificar las credenciales del usuario. 
import bcrypt from "bcrypt"; // Importamos bcrypt para poder comparar la contraseña proporcionada por el usuario con el hash almacenado en la base de datos durante el proceso de login. Esto es una buena práctica de seguridad, ya que permite verificar las contraseñas sin necesidad de almacenarlas en texto plano. Al usar bcrypt, podemos asegurarnos de que las contraseñas de los administradores estén protegidas incluso si la base de datos es comprometida. En este controlador, utilizaremos bcrypt para comparar la contraseña ingresada por el usuario con el hash almacenado en la base de datos y determinar si las credenciales son válidas para permitir el acceso al sistema.
import jwt from "jsonwebtoken"; // Importamos jsonwebtoken para poder generar tokens JWT (JSON Web Tokens) durante el proceso de login de los administradores. Los tokens JWT son una forma segura y eficiente de manejar la autenticación y autorización en aplicaciones web. Al generar un token JWT después de verificar las credenciales del usuario, podemos incluir información relevante (como el ID del administrador) en el token, lo que permitirá al frontend autenticar las solicitudes posteriores sin necesidad de enviar las credenciales en cada solicitud. En este controlador, utilizaremos jsonwebtoken para crear un token JWT que se devolverá al cliente después de un login exitoso, permitiendo así una experiencia de usuario fluida y segura.

export const loginAdmin = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        // Usamos 'pool' directamente para hacer la consulta de login, ya que es una consulta específica que no encaja exactamente con los métodos CRUD del modelo 'Administrador'.
        const [rows] = await pool.query('SELECT * FROM administradores WHERE usuario = ?', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const admin = rows[0];
        
        // Comparamos la contraseña plana con el hash de la base de datos
        const esValida = await bcrypt.compare(contrasena, admin.contrasena);

        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Genera el token. Asegúrate de tener JWT_SECRET en tu .env
        const token = jwt.sign(
            { id: admin.ID_ADMINISTRADOR }, 
            process.env.JWT_SECRET || 'clave_secreta_temporal', 
            { expiresIn: '1h' }
        );

        // Devolvemos la estructura exacta que espera tu Frontend
        res.json({ 
            success: true, 
            token, 
            nombre: admin.Nombre,
            rol: 'admin'
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
        // En mysql2 se usa .query() y pasamos el ID en un arreglo para evitar inyección SQL
        const [rows] = await pool.query('SELECT * FROM administradores WHERE ID_ADMINISTRADOR = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
        }

        res.json({ success: true, data: rows[0] });
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
    const id = typeof req.params.id === 'string' ? req.params.id : req.body.ID_ADMINISTRADOR_ORIGINAL;

    if (typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'ID original no proporcionado' });
    }

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

