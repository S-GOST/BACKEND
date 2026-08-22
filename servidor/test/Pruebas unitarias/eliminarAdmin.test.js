// test/Pruebas unitarias/eliminarAdmin.test.js

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
const { eliminarAdmin } = require('../../controllers/adminController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const Usuario = require('../../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa (Inhabilitación)', () => {
    test('Debe inhabilitar al administrador cambiando su estado a Inactivo', async () => {
      const id = '5';
      const adminMock = {
        id_usuario: 5,
        numero_documento: '12345678',
        nombre: 'Admin Principal',
        usuario: 'admin1',
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.findByPk.mockResolvedValue(adminMock);
      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        user: { id_usuario: 10 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      // Validar que se buscó el usuario por ID
      expect(Usuario.findByPk).toHaveBeenCalledWith(id);

      // Validar que se actualizó el estado a 'Inactivo' (soft delete)
      expect(Usuario.update).toHaveBeenCalledWith(id, { estado: 'Inactivo' });

      // Validar logHistory
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'usuarios',
        5,
        'DELETE',
        'Se inhabilitó el administrador Admin Principal'
      );

      // Validar respuesta exitosa
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Administrador inhabilitado'
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '7';
      const adminMock = {
        id_usuario: 7,
        numero_documento: '87654321',
        nombre: 'Admin Sin User',
        id_rol: 1,
        estado: 'Activo'
      };

      Usuario.findByPk.mockResolvedValue(adminMock);
      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'usuarios',
        7,
        'DELETE',
        'Se inhabilitó el administrador Admin Sin User'
      );
    });

    test('Debe permitir inhabilitar un admin que ya estaba inactivo', async () => {
      const id = '8';
      const adminInactivoMock = {
        id_usuario: 8,
        numero_documento: '11223344',
        nombre: 'Admin Ya Inactivo',
        id_rol: 1,
        estado: 'Inactivo'
      };

      Usuario.findByPk.mockResolvedValue(adminInactivoMock);
      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      // El controlador no valida el estado previo, solo el id_rol
      expect(Usuario.update).toHaveBeenCalledWith(id, { estado: 'Inactivo' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Administrador inhabilitado'
      });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el usuario no existe (null)', async () => {
      const id = '999';

      Usuario.findByPk.mockResolvedValue(null);

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(Usuario.update).not.toHaveBeenCalled(); // No debe actualizar si no existe
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado'
      });
    });

    test('Debe devolver 404 si el usuario existe pero no es admin (id_rol = 3 - cliente)', async () => {
      const id = '10';
      const clienteMock = {
        id_usuario: 10,
        numero_documento: '87654321',
        nombre: 'Cliente Regular',
        id_rol: 3, // Rol de cliente
        estado: 'Activo'
      };

      Usuario.findByPk.mockResolvedValue(clienteMock);

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(Usuario.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado'
      });
    });

    test('Debe devolver 404 si el usuario es técnico (id_rol = 2)', async () => {
      const id = '15';
      const tecnicoMock = {
        id_usuario: 15,
        numero_documento: '55667788',
        nombre: 'Técnico',
        id_rol: 2,
        estado: 'Activo'
      };

      Usuario.findByPk.mockResolvedValue(tecnicoMock);

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(Usuario.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la búsqueda del usuario', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');

      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(Usuario.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe devolver 500 si falla la actualización del estado', async () => {
      const id = '5';
      const adminMock = {
        id_usuario: 5,
        numero_documento: '12345678',
        nombre: 'Admin Error Update',
        id_rol: 1,
        estado: 'Activo'
      };
      const dbError = new Error('Error al actualizar');

      Usuario.findByPk.mockResolvedValue(adminMock);
      Usuario.update.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(Usuario.update).toHaveBeenCalledWith(id, { estado: 'Inactivo' });
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al actualizar'
      });
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const adminMock = {
        id_usuario: 5,
        numero_documento: '12345678',
        nombre: 'Admin Log Error',
        id_rol: 1,
        estado: 'Activo'
      };
      const logError = new Error('Error al registrar historial');

      Usuario.findByPk.mockResolvedValue(adminMock);
      Usuario.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockRejectedValue(logError);

      const req = { 
        params: { id }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarAdmin(req, res);

      expect(Usuario.findByPk).toHaveBeenCalled();
      expect(Usuario.update).toHaveBeenCalled();
      expect(logHistory).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al registrar historial'
      });
    });
  });
});