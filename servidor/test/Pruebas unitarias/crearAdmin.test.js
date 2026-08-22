// test/Pruebas unitarias/crearAdmin.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/usuarioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    findOneWithPassword: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

jest.mock('../../middleware/refreshToken.js', () => ({
  generarTokens: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

// Mock de seguridad para db.js
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador y las dependencias simuladas
const { crearAdmin } = require('../../controllers/adminController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const Usuario = require('../../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe crear administrador con id_rol = 1 y estado Activo', async () => {
      const bodyMock = {
        numero_documento: '12345678',
        id_tipo_documento: 1,
        nombre: 'Admin Nuevo',
        usuario: 'adminnuevo',
        password: 'password123',
        correo: 'admin@sistema.com',
        telefono: '3001234567'
      };
      
      const newUserMock = {
        id_usuario: 10,
        ...bodyMock,
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.create.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(newUserMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 5 } };
      const res = mockRes();

      await crearAdmin(req, res);

      // Validar que se llamó create con el payload mapeado (con id_rol: 1 y estado: 'Activo')
      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          numero_documento: '12345678',
          id_tipo_documento: 1,
          nombre: 'Admin Nuevo',
          usuario: 'adminnuevo',
          password: 'password123',
          correo: 'admin@sistema.com',
          telefono: '3001234567',
          id_rol: 1,      // Asignado por mapToUsuario
          estado: 'Activo' // Asignado por mapToUsuario
        })
      );

      // Validar que se buscó el usuario por numero_documento (no por id)
      expect(Usuario.findByPk).toHaveBeenCalledWith('12345678');

      // Validar que se registró en el historial
      expect(logHistory).toHaveBeenCalledWith(
        5, // req.user.id_usuario
        'usuarios',
        10, // newUser.id_usuario
        'INSERT',
        'Se creó el administrador Admin Nuevo'
      );

      // Validar respuesta exitosa
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: newUserMock
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = {
        numero_documento: '87654321',
        nombre: 'Admin Sin User',
        usuario: 'adminsinuser',
        password: 'pass123',
        correo: 'admin2@sistema.com'
      };
      
      const newUserMock = {
        id_usuario: 11,
        ...bodyMock,
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.create.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(newUserMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearAdmin(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'usuarios',
        11,
        'INSERT',
        'Se creó el administrador Admin Sin User'
      );
    });

    test('Debe ignorar campos adicionales en el body que no estén en mapToUsuario', async () => {
      const bodyMock = {
        numero_documento: '11223344',
        nombre: 'Admin Con Extras',
        usuario: 'adminextras',
        password: 'pass123',
        correo: 'admin3@sistema.com',
        campoInvalido: 'esto se ignora', // No está en mapToUsuario
        otroCampo: 999 // También se ignora
      };
      
      const newUserMock = {
        id_usuario: 12,
        numero_documento: '11223344',
        nombre: 'Admin Con Extras',
        usuario: 'adminextras',
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.create.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(newUserMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearAdmin(req, res);

      // Validar que los campos adicionales NO se pasaron a create
      expect(Usuario.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          campoInvalido: 'esto se ignora',
          otroCampo: 999
        })
      );
    });
  });

  describe('Manejo de duplicados (ER_DUP_ENTRY)', () => {
    test('Debe devolver 400 si el documento ya está registrado', async () => {
      const bodyMock = {
        numero_documento: '12345678',
        nombre: 'Admin Duplicado',
        usuario: 'admindup',
        password: 'pass123',
        correo: 'dup@sistema.com'
      };
      
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Usuario.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearAdmin(req, res);

      expect(Usuario.create).toHaveBeenCalled();
      expect(Usuario.findByPk).not.toHaveBeenCalled(); // No debe buscar si create falló
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El documento o correo ya se encuentra registrado'
      });
    });

    test('Debe devolver 400 si el correo ya está registrado', async () => {
      const bodyMock = {
        numero_documento: '99999999',
        nombre: 'Admin Correo Dup',
        usuario: 'admincorrdup',
        password: 'pass123',
        correo: 'yaexiste@sistema.com'
      };
      
      const duplicateError = new Error('Duplicate entry for correo');
      duplicateError.code = 'ER_DUP_ENTRY';

      Usuario.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El documento o correo ya se encuentra registrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la creación del usuario', async () => {
      const bodyMock = {
        numero_documento: '12345678',
        nombre: 'Admin Error',
        usuario: 'adminerror',
        password: 'pass123',
        correo: 'error@sistema.com'
      };
      
      const dbError = new Error('Error de conexión a la BD');

      Usuario.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearAdmin(req, res);

      expect(Usuario.findByPk).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe devolver 500 si falla la búsqueda del usuario creado', async () => {
      const bodyMock = {
        numero_documento: '12345678',
        nombre: 'Admin FindByPk Error',
        usuario: 'adminfpkerror',
        password: 'pass123',
        correo: 'fpk@sistema.com'
      };
      
      const dbError = new Error('Error al buscar usuario');

      Usuario.create.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearAdmin(req, res);

      expect(Usuario.create).toHaveBeenCalled();
      expect(Usuario.findByPk).toHaveBeenCalledWith('12345678');
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al buscar usuario'
      });
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const bodyMock = {
        numero_documento: '12345678',
        nombre: 'Admin Log Error',
        usuario: 'adminlogerror',
        password: 'pass123',
        correo: 'log@sistema.com'
      };
      
      const newUserMock = {
        id_usuario: 13,
        ...bodyMock,
        id_rol: 1,
        estado: 'Activo'
      };
      
      const logError = new Error('Error al registrar historial');

      Usuario.create.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(newUserMock);
      logHistory.mockRejectedValue(logError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearAdmin(req, res);

      expect(Usuario.create).toHaveBeenCalled();
      expect(Usuario.findByPk).toHaveBeenCalled();
      expect(logHistory).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al registrar historial'
      });
    });
  });
});