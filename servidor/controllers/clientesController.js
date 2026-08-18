import Usuario from "../models/usuarioModel.js";
import bcrypt from "bcrypt";
import { logHistory } from "../utils/historyLogger.js";
import { generarTokens, setRefreshTokenCookie } from "../middleware/refreshToken.js";
import { enviarCorreoAprobacion } from "../utils/mailer.js";

const mapToUsuario = (c) => {
  const obj = {};
  if (c.numero_documento !== undefined) obj.numero_documento = c.numero_documento;
  if (c.id_tipo_documento !== undefined) obj.id_tipo_documento = c.id_tipo_documento;
  if (c.nombre !== undefined) obj.nombre = c.nombre;
  if (c.usuario !== undefined) obj.usuario = c.usuario;
  if (c.password !== undefined) obj.password = c.password;
  if (c.correo !== undefined) obj.correo = c.correo;
  if (c.telefono !== undefined) obj.telefono = c.telefono;
  if (c.ciudad !== undefined) obj.ciudad = c.ciudad;

  obj.id_rol = 3; // Rol de Cliente
  obj.estado = 'Pendiente'; // RF-007: Clientes inician pendientes
  return obj;
};

//Login con tokens JWT unificados + refresh token
export const loginCliente = async (req, res) => {
  const { usuario, contrasena } = req.body;

  // Validación de campos requeridos
  if (!usuario || !contrasena || usuario.trim() === '' || contrasena.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos'
    });
  }

  try {
    //Usar findOneWithPassword para obtener hash (nunca exponer password)
    const user = await Usuario.findOneWithPassword({ where: { usuario, id_rol: 3 } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const esValida = await bcrypt.compare(contrasena, user.password);
    if (!esValida) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (user.estado === 'Pendiente') {
      return res.status(403).json({ success: false, message: 'Tu cuenta está pendiente de aprobación por un administrador.' });
    }
    if (user.estado === 'Rechazado') {
      return res.status(403).json({ success: false, message: 'Tu cuenta ha sido rechazada. Contacta a soporte para más información.' });
    }
    if (user.estado !== 'Activo') {
      return res.status(403).json({ success: false, message: 'Tu cuenta no está activa.' });
    }

    // RFN-002: Generar accessToken (1h) + refreshToken (24h)
    const { accessToken, refreshToken } = generarTokens(user);

    // Setear refreshToken como cookie httpOnly
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      token: accessToken,
      nombre: user.nombre,
      rol: 'cliente',
      id_usuario: user.id_usuario
    });
  } catch (error) {
    console.error("Error en el login de cliente:", error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const obtenerClientes = async (req, res) => {
  try {
    const users = await Usuario.findAll({ where: { id_rol: 3 } });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerClientePorId = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Usuario.findByPk(id);
    if (!user || user.id_rol !== 3) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const userPayload = mapToUsuario(req.body);
    await Usuario.create(userPayload);
    const newUser = await Usuario.findByPk(userPayload.numero_documento);

    await logHistory(
      req.user?.id_usuario || 1,
      'usuarios',
      newUser.id_usuario,
      'INSERT',
      `Se creó el cliente ${newUser.nombre}`
    );

    res.json({ success: true, data: newUser });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'El documento o correo ya se encuentra registrado' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  const id = req.params.id || req.body.numero_documento;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID (numero_documento) es requerido' });
  }
  try {
    const userPayload = mapToUsuario(req.body);
    await Usuario.update(id, userPayload);
    const userActualizado = await Usuario.findByPk(userPayload.numero_documento || id);
    if (!userActualizado || userActualizado.id_rol !== 3) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado después de actualizar' });
    }

    await logHistory(
      req.user?.id_usuario || 1,
      'usuarios',
      userActualizado.id_usuario,
      'UPDATE',
      `Se actualizó el cliente ${userActualizado.nombre}`
    );

    res.json({ success: true, data: userActualizado });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'El documento o correo ya se encuentra registrado por otro usuario' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const eliminarCliente = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID (numero_documento) es requerido' });
  }
  try {
    const user = await Usuario.findByPk(id);
    if (!user || user.id_rol !== 3) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    await Usuario.delete(id);

    await logHistory(
      req.user?.id_usuario || 1,
      'usuarios',
      user.id_usuario,
      'DELETE',
      `Se eliminó el cliente ${user.nombre}`
    );

    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerClientesPendientes = async (req, res) => {
  try {
    const users = await Usuario.findAll({ where: { id_rol: 3, estado: 'Pendiente' } });
    if (users.length === 0) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const procesarAprobacionCliente = async (req, res) => {
  const { id } = req.params;
  const { accion, justificacion } = req.body;

  if (!accion || (accion !== 'Aprobar' && accion !== 'Rechazar')) {
    return res.status(400).json({ success: false, message: 'Acción inválida. Debe ser Aprobar o Rechazar.' });
  }

  if (accion === 'Rechazar' && (!justificacion || justificacion.trim() === '')) {
    return res.status(400).json({ success: false, message: 'Se requiere justificación para rechazar un cliente.' });
  }

  try {
    const user = await Usuario.findByPk(id);
    if (!user || user.id_rol !== 3) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    if (user.estado !== 'Pendiente') {
      return res.status(400).json({ success: false, message: 'Este cliente ya fue procesado.' });
    }

    const nuevoEstado = accion === 'Aprobar' ? 'Activo' : 'Rechazado';
    
    await Usuario.update(id, { estado: nuevoEstado });

    await logHistory(
      req.user?.id_usuario || 1,
      'usuarios',
      user.id_usuario,
      'UPDATE',
      `Se ${accion.toLowerCase()} el cliente ${user.nombre}`
    );

    // Enviar correo
    await enviarCorreoAprobacion(user.correo, nuevoEstado, justificacion);

    res.json({ 
      success: true, 
      message: `Cliente ${accion.toLowerCase() === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente. Se ha notificado al cliente.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
