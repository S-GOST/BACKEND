import Usuario from "../models/usuarioModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const mapToUsuario = (a) => {
    const obj = {};
    if (a.numero_documento !== undefined) obj.numero_documento = a.numero_documento;
    if (a.id_tipo_documento !== undefined) obj.id_tipo_documento = a.id_tipo_documento;
    if (a.nombre !== undefined) obj.nombre = a.nombre;
    if (a.usuario !== undefined) obj.usuario = a.usuario;
    if (a.password !== undefined) obj.password = a.password;
    if (a.correo !== undefined) obj.correo = a.correo;
    if (a.telefono !== undefined) obj.telefono = a.telefono;

    obj.id_rol = 1; // Rol de Administrador
    return obj;
};

export const loginAdmin = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        const user = await Usuario.findOne({ where: { usuario, id_rol: 1 } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        
        const esValida = await bcrypt.compare(contrasena, user.password);
        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.numero_documento }, 
            process.env.JWT_SECRET || 'clave_secreta_temporal', 
            { expiresIn: '1h' }
        );

        res.json({ 
            success: true, 
            token, 
            nombre: user.nombre,
            rol: 'admin'
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const obtenerAdmins = async (req, res) => {
    try {
        const users = await Usuario.findAll({ where: { id_rol: 1 } });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerAdminPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Usuario.findByPk(id);
        if (!user || user.id_rol !== 1) {
            return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearAdmin = async (req, res) => {
    try {
        const userPayload = mapToUsuario(req.body);
        await Usuario.create(userPayload);    
        const newUser = await Usuario.findByPk(userPayload.numero_documento);
        res.json({ success: true, data: newUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarAdmin = async (req, res) => {
    const id = req.params.id;
    try {
        const userPayload = mapToUsuario(req.body);
        await Usuario.update(id, userPayload);
        const adminActualizado = await Usuario.findByPk(userPayload.numero_documento || id);
        if (!adminActualizado || adminActualizado.id_rol !== 1) {
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
        const user = await Usuario.findByPk(id);
        if (!user || user.id_rol !== 1) {
            return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
        }
        await Usuario.delete(id);
        res.json({ success: true, message: 'Administrador eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};