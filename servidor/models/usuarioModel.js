import prisma from '../config/prisma.js'; // Tu nuevo archivo de conexión
import bcrypt from 'bcrypt';

// RFN-001: Nunca mostrar contraseñas en respuestas.
// En Prisma, en lugar de un string, usamos un objeto 'select' para decir qué campos queremos
const COLUMNAS_SEGURAS = {
  id_usuario: true,
  id_rol: true,
  id_tipo_documento: true,
  numero_documento: true,
  nombre: true,
  ciudad: true,
  usuario: true,
  correo: true,
  telefono: true,
  estado: true,
  // NOTA: password no está aquí, así que Prisma nunca lo devolverá en estos queries
};

const Usuario = {
  // Obtener todos
  findAll: async (conditions = {}) => {
    return await prisma.usuarios.findMany({
      where: conditions.where || {},
      select: COLUMNAS_SEGURAS
    });
  },

  // Buscar por número de documento
  findByPk: async (numero_documento) => {
    return await prisma.usuarios.findUnique({
      where: { numero_documento: BigInt(numero_documento) },
      select: COLUMNAS_SEGURAS
    });
  },

  // Buscar un registro por condición general (Ej: correo o usuario)
  findOne: async (conditions) => {
    return await prisma.usuarios.findFirst({
      where: conditions.where,
      select: COLUMNAS_SEGURAS
    });
  },

  // Buscar un registro CON password (SOLO PARA LOGIN)
  findOneWithPassword: async (conditions) => {
    return await prisma.usuarios.findFirst({
      where: conditions.where
      // Al no poner 'select', Prisma trae todo, incluyendo el password
    });
  },

  // Crear nuevo usuario con bcrypt
  create: async (data) => {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    return await prisma.usuarios.create({
      data: {
        ...data,
        password: passwordHash,
        estado: data.estado || 'Activo'
      }
    });
  },

  // Actualizar usuario con rehash condicional
  update: async (numero_documento_id, data) => {
    const datosActualizar = { ...data };

    // Si se envió una contraseña nueva, la hasheamos
    if (data.password) {
      datosActualizar.password = await bcrypt.hash(data.password, 10);
    }

    return await prisma.usuarios.update({
      where: { numero_documento: BigInt(numero_documento_id) },
      data: datosActualizar
    });
  },

  // Eliminar usuario
  delete: async (numero_documento) => {
    return await prisma.usuarios.delete({
      where: { numero_documento: BigInt(numero_documento) }
    });
  },

  // Guardar token de recuperación de contraseña
  setResetToken: async (correo, token, expiracion) => {
    return await prisma.usuarios.update({
      where: { correo: correo },
      data: {
        reset_token: token,
        reset_token_expires: expiracion
      }
    });
  },

  // Buscar usuario por token válido
  findByResetToken: async (token) => {
    return await prisma.usuarios.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() } // Mayor a la fecha actual (NOW)
      }
    });
  },

  // Actualizar contraseña directamente (Reset Password)
  updatePassword: async (numero_documento, passwordHash) => {
    return await prisma.usuarios.update({
      where: { numero_documento: BigInt(numero_documento) },
      data: {
        password: passwordHash,
        reset_token: null,
        reset_token_expires: null
      }
    });
  }
};

export default Usuario;
