import tecnicos from "../models/tecnicoModel.js"; // Importamos el modelo 'tecnicos' para poder utilizar sus métodos y realizar operaciones relacionadas con los tecnicos en la base de datos.    
import pool from "../config/db.js"; // Importamos el pool de conexiones a la base de datos para poder realizar consultas SQL directamente desde este controlador, especialmente para operaciones que no están cubiertas por los métodos del modelo 'Administrador', como el login que requiere una consulta específica para verificar las credenciales del usuario. 
import bcrypt from "bcrypt"; // ¡IMPORTANTE! Faltaba esta importación
import jwt from "jsonwebtoken"; // ¡IMPORTANTE! Faltaba esta importación

export const loginTecnico = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        // Usamos 'pool' directamente para hacer la consulta de login, ya que es una consulta específica que no encaja exactamente con los métodos CRUD del modelo 'Tecnicos'.
        const [rows] = await pool.query('SELECT * FROM tecnicos WHERE usuario = ?', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const tec = rows[0];
        
        // Comparamos la contraseña plana con el hash de la base de datos
        const esValida = await bcrypt.compare(contrasena, tec.contrasena);

        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Genera el token. Asegúrate de tener JWT_SECRET en tu .env
        const token = jwt.sign(
            { id: tec.ID_TECNICOS },
            process.env.JWT_SECRET || 'clave_secreta_temporal',
            { expiresIn: '1h' }
        );

        // Devolvemos la estructura exacta que espera tu Frontend
        res.json({ 
            success: true, 
            token, 
            nombre: tec.Nombre,
            rol: 'tecnico'
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const obtenerTec = async (req, res) => {
    try {
        const tec = await tecnicos.findAll();
        // Ajustamos para que coincida con lo que busca tu componente Tecnico.tsx (res.data.data)
        res.json({ success: true, data: tec });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerTecPorId = async (req, res) => {
    const { id } = req.params;
    try {
        // En mysql2 se usa .query() y pasamos el ID en un arreglo para evitar inyección SQL
        const [rows] = await pool.query('SELECT * FROM tecnicos WHERE ID_TECNICOS = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tecnico no encontrado' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearTec = async (req, res) => {
    try {
        const nuevoTec = await tecnicos.create(req.body);    
        res.json({ success: true, data: nuevoTec });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarTec = async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id : req.body.ID_TECNICO_ORIGINAL;

    if (typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'ID original no proporcionado' });
    }

    try {
        const tecActualizado = await tecnicos.update(id, req.body);  
        res.json({ success: true, data: tecActualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }   
};

export const eliminarTec = async (req, res) => {
    const { id } = req.params;
    try {
        await tecnicos.delete(id);
        res.json({ success: true, message: 'Tecnico eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

