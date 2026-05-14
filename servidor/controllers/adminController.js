import Administrador from "../models/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        // Usamos el método findOne del modelo para buscar por nombre de usuario
        const admin = await Administrador.findOne({ where: { usuario } });

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        
        // Comparamos la contraseña plana con el hash de la base de datos
        const esValida = await bcrypt.compare(contrasena, admin.contrasena);

        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Genera el token
        const token = jwt.sign(
            { id: admin.ID_ADMINISTRADOR }, 
            process.env.JWT_SECRET || 'clave_secreta_temporal', 
            { expiresIn: '1h' }
        );

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
        // Opcional: encriptar la contraseña antes de guardar si viene en texto plano
        if (req.body.contrasena) {
            const saltRounds = 10;
            req.body.contrasena = await bcrypt.hash(req.body.contrasena, saltRounds);
        }
        const nuevoAdmin = await Administrador.create(req.body);    
        res.json({ success: true, data: nuevoAdmin });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarAdmin = async (req, res) => {
  const id = req.params.id; // directo, sin validaciones extrañas
  try {
    if (req.body.contrasena) {
      const saltRounds = 10;
      req.body.contrasena = await bcrypt.hash(req.body.contrasena, saltRounds);
    }
    await Administrador.update(id, req.body);
    // Obtener el registro actualizado
    const adminActualizado = await Administrador.findByPk(id);
    if (!adminActualizado) {
      return res.status(404).json({ success: false, message: 'Administrador no encontrado después de actualizar' });
    }
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