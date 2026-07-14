import Usuario from "../models/usuarioModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { logHistory } from "../utils/historyLogger.js";

const mapToUsuario = (t) => {
    const obj = {};
    if (t.numero_documento !== undefined) obj.numero_documento = t.numero_documento;
    if (t.id_tipo_documento !== undefined) obj.id_tipo_documento = t.id_tipo_documento;
    if (t.nombre !== undefined) obj.nombre = t.nombre;
    if (t.usuario !== undefined) obj.usuario = t.usuario;
    if (t.password !== undefined) obj.password = t.password;
    if (t.correo !== undefined) obj.correo = t.correo;
    if (t.telefono !== undefined) obj.telefono = t.telefono;

    obj.id_rol = 2; // Rol de Técnico
    return obj;
};

export const loginTecnico = async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        const user = await Usuario.findOne({ where: { usuario, id_rol: 2 } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const esValida = await bcrypt.compare(contrasena, user.password);
        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.numero_documento, id_usuario: user.id_usuario },
            process.env.JWT_SECRET || 'clave_secreta_temporal',
            { expiresIn: '1h' }
        );

        res.json({ 
            success: true, 
            token, 
            nombre: user.nombre,
            rol: 'tecnico',
            id_usuario: user.id_usuario
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const obtenerTec = async (req, res) => {
    try {
        const users = await Usuario.findAll({ where: { id_rol: 2 } });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerTecPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Usuario.findByPk(id);
        if (!user || user.id_rol !== 2) {
            return res.status(404).json({ success: false, message: 'Tecnico no encontrado' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const crearTec = async (req, res) => {
    try {
        const userPayload = mapToUsuario(req.body);
        await Usuario.create(userPayload);    
        const newUser = await Usuario.findByPk(userPayload.numero_documento);
        
        await logHistory(
            req.user?.id_usuario || 1, 
            'usuarios', 
            newUser.id_usuario, 
            'INSERT', 
            `Se creó el técnico ${newUser.nombre}`
        );

        res.json({ success: true, data: newUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const actualizarTec = async (req, res) => {
    const id = req.params.id;
    try {
        const userPayload = mapToUsuario(req.body);
        await Usuario.update(id, userPayload);  
        const userActualizado = await Usuario.findByPk(userPayload.numero_documento || id);
        if (!userActualizado || userActualizado.id_rol !== 2) {
            return res.status(404).json({ success: false, message: 'Tecnico no encontrado después de actualizar' });
        }

        await logHistory(
            req.user?.id_usuario || 1, 
            'usuarios', 
            userActualizado.id_usuario, 
            'UPDATE', 
            `Se actualizó el técnico ${userActualizado.nombre}`
        );

        res.json({ success: true, data: userActualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }   
};

export const eliminarTec = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Usuario.findByPk(id);
        if (!user || user.id_rol !== 2) {
            return res.status(404).json({ success: false, message: 'Tecnico no encontrado' });
        }
        await Usuario.delete(id);

        await logHistory(
            req.user?.id_usuario || 1, 
            'usuarios', 
            user.id_usuario, 
            'DELETE', 
            `Se eliminó el técnico ${user.nombre}`
        );

        res.json({ success: true, message: 'Tecnico eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};