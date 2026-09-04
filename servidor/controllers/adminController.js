import Usuario from "../models/usuarioModel.js";
import bcrypt from "bcrypt";
import { logHistory } from "../utils/historyLogger.js";
import { generarTokens, setRefreshTokenCookie } from "../middleware/refreshToken.js";

const mapToUsuario = (a) => {
    const obj = {};
    if (a.numero_documento !== undefined) obj.numero_documento = BigInt(a.numero_documento);
    if (a.id_tipo_documento !== undefined) obj.id_tipo_documento = parseInt(a.id_tipo_documento, 10);
    if (a.nombre !== undefined) obj.nombre = a.nombre;
    if (a.usuario !== undefined) obj.usuario = a.usuario;
    if (a.password !== undefined) obj.password = a.password;
    if (a.correo !== undefined) obj.correo = a.correo;
    if (a.telefono !== undefined) obj.telefono = a.telefono;

    obj.id_rol = 1; // Rol de Administrador
    if (a.estado !== undefined) obj.estado = a.estado;
    else if (!a.id_usuario) obj.estado = 'Activo';
    return obj;
};

// RFN-002: Login con tokens JWT unificados + refresh token
export const loginAdmin = async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const user = await Usuario.findOneWithPassword({ where: { usuario, id_rol: 1 } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const esValida = await bcrypt.compare(password, user.password);
        if (!esValida) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const { accessToken, refreshToken } = generarTokens(user);
        setRefreshTokenCookie(res, refreshToken);

        res.json({
            success: true,
            token: accessToken,
            nombre: user.nombre,
            rol: 'admin',
            id_usuario: user.id_usuario
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const obtenerAdmins = async (req, res) => {
    try {
        const users = await Usuario.findAll({ where: { id_rol: 1 } });
        res.json({
            success: true,
            data: users.map(u => ({
                ...u,
                numero_documento: u.numero_documento ? u.numero_documento.toString() : null
            }))
        });
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

        user.numero_documento = user.numero_documento ? user.numero_documento.toString() : null;
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

        await logHistory(
            req.user?.id_usuario || 1,
            'usuarios',
            newUser.id_usuario,
            'INSERT',
            `Se creó el administrador ${newUser.nombre}`
        );

        newUser.numero_documento = newUser.numero_documento ? newUser.numero_documento.toString() : null;
        res.json({ success: true, data: newUser });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El documento o correo ya se encuentra registrado' });
        }
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

        await logHistory(
            req.user?.id_usuario || 1,
            'usuarios',
            adminActualizado.id_usuario,
            'UPDATE',
            `Se actualizó el administrador ${adminActualizado.nombre}`
        );

        adminActualizado.numero_documento = adminActualizado.numero_documento ? adminActualizado.numero_documento.toString() : null;
        res.json({ success: true, data: adminActualizado });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El documento o correo ya se encuentra registrado por otro usuario' });
        }
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

        await Usuario.update(id, { estado: 'Inactivo' });

        await logHistory(
            req.user?.id_usuario || 1,
            'usuarios',
            user.id_usuario,
            'DELETE',
            `Se inhabilitó el administrador ${user.nombre}`
        );

        res.json({ success: true, message: 'Administrador inhabilitado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
