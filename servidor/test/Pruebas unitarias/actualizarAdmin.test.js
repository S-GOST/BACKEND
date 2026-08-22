// test/Pruebas unitarias/actualizarAdmin.test.js

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
const { actualizarAdmin } = require('../../controllers/adminController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const Usuario = require('../../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('actualizarAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe actualizar administrador y devolver los datos actualizados', async () => {
      const id = '5';
      const bodyMock = {
        numero_documento: '12345678',
        nombre: 'Admin Actualizado',
        usuario: 'adminactualizado',
        correo: 'admin@sistema.com',
        telefono: '3009999999'
      };
      
      const adminActualizadoMock = {
        id_usuario: 5,
        ...bodyMock,
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(adminActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 10 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      // Validar que se llamó update con el payload mapeado
      expect(Usuario.update).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          numero_documento: '12345678',
          nombre: 'Admin Actualizado',
          id_rol: 1,
          estado: 'Activo'
        })
      );

      // Validar que se buscó por numero_documento (prioridad sobre id)
      expect(Usuario.findByPk).toHaveBeenCalledWith('12345678');

      // Validar logHistory
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'usuarios',
        5,
        'UPDATE',
        'Se actualizó el administrador Admin Actualizado'
      );

      // Validar respuesta
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: adminActualizadoMock
      });
    });

    test('Debe buscar por id si numero_documento no está en el body', async () => {
      const id = '5';
      const bodyMock = {
        nombre: 'Admin Sin Doc',
        correo: 'admin@sistema.com'
        // Sin numero_documento
      };
      
      const adminActualizadoMock = {
        id_usuario: 5,
        numero_documento: '12345678',
        nombre: 'Admin Sin Doc',
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(adminActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      // Debe usar el id del params como fallback
      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: adminActualizadoMock
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '5';
      const bodyMock = {
        numero_documento: '12345678',
        nombre: 'Admin Sin User'
      };
      
      const adminActualizadoMock = {
        id_usuario: 5,
        ...bodyMock,
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(adminActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'usuarios',
        5,
        'UPDATE',
        'Se actualizó el administrador Admin Sin User'
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el admin no se encuentra después de actualizar', async () => {
      const id = '999';
      const bodyMock = {
        numero_documento: '99999999',
        nombre: 'Admin Inexistente'
      };

      Usuario.update.mockResolvedValue({ affectedRows: 0 });
      Usuario.findByPk.mockResolvedValue(null);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(Usuario.update).toHaveBeenCalled();
      expect(Usuario.findByPk).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado después de actualizar'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 404 si el usuario encontrado no es admin (id_rol !== 1)', async () => {
      const id = '10';
      const bodyMock = {
        numero_documento: '87654321',
        nombre: 'Cliente No Admin'
      };
      
      const clienteMock = {
        id_usuario: 10,
        numero_documento: '87654321',
        nombre: 'Cliente No Admin',
        id_rol: 3, // Rol de cliente
        estado: 'Activo'
      };

      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(clienteMock);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado después de actualizar'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de duplicados (ER_DUP_ENTRY)', () => {
    test('Debe devolver 400 si el documento o correo ya está registrado', async () => {
      const id = '5';
      const bodyMock = {
        numero_documento: '12345678',
        correo: 'yaexiste@sistema.com'
      };
      
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Usuario.update.mockRejectedValue(duplicateError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(Usuario.update).toHaveBeenCalled();
      expect(Usuario.findByPk).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El documento o correo ya se encuentra registrado por otro usuario'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la actualización', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Admin Error' };
      const dbError = new Error('Error de conexión a la BD');

      Usuario.update.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(Usuario.findByPk).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe devolver 500 si falla la búsqueda después de actualizar', async () => {
      const id = '5';
      const bodyMock = { numero_documento: '12345678', nombre: 'Admin' };
      const dbError = new Error('Error al buscar usuario');

      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(Usuario.update).toHaveBeenCalled();
      expect(Usuario.findByPk).toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al buscar usuario'
      });
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const bodyMock = { numero_documento: '12345678', nombre: 'Admin Log' };
      
      const adminMock = {
        id_usuario: 5,
        ...bodyMock,
        id_rol: 1,
        estado: 'Activo'
      };
      
      const logError = new Error('Error al registrar historial');

      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      Usuario.findByPk.mockResolvedValue(adminMock);
      logHistory.mockRejectedValue(logError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarAdmin(req, res);

      expect(Usuario.update).toHaveBeenCalled();
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