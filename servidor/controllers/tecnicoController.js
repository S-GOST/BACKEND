import tecnicos from "../models/tecnicoModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginTecnico = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        // Buscar técnico por nombre de usuario usando el modelo
        const tecnico = await tecnicos.findOne({ where: { usuario } });

        if (!tecnico) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const esValida = await bcrypt.compare(contrasena, tecnico.contrasena);

        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: tecnico.ID_TECNICOS },
            process.env.JWT_SECRET || 'clave_secreta_temporal',
            { expiresIn: '1h' }
        );

        res.json({ 
            success: true, 
            token, 
            nombre: tecnico.Nombre,
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
        res.json({ success: true, data: tec });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerTecPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const tecnico = await tecnicos.findByPk(id);

        if (!tecnico) {
            return res.status(404).json({ success: false, message: 'Tecnico no encontrado' });
        }

        res.json({ success: true, data: tecnico });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearTec = async (req, res) => {
    try {
        // Opcional: encriptar la contraseña antes de guardar si viene en texto plano
        if (req.body.contrasena) {
            const saltRounds = 10;
            req.body.contrasena = await bcrypt.hash(req.body.contrasena, saltRounds);
        }
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
        // Si se actualiza la contraseña, encriptarla nuevamente
        if (req.body.contrasena) {
            const saltRounds = 10;
            req.body.contrasena = await bcrypt.hash(req.body.contrasena, saltRounds);
        }
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