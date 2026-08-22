// test/Pruebas unitarias/obtenerAdminPorId.test.js

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

// Importamos el controlador
const { obtenerAdminPorId } = require('../../controllers/adminController.js');

// Referencia al modelo simulado
const Usuario = require('../../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerAdminPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el administrador si existe con id_rol = 1', async () => {
      const id = '5';
      const adminMock = { 
        id_usuario: 5,
        numero_documento: '12345678',
        nombre: 'Admin Principal',
        usuario: 'admin1',
        correo: 'admin1@sistema.com',
        telefono: '3001234567',
        id_rol: 1,
        estado: 'Activo'
      };
      
      Usuario.findByPk.mockResolvedValue(adminMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerAdminPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: adminMock 
      });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el usuario no existe (null)', async () => {
      const id = '999';
      
      Usuario.findByPk.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerAdminPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado'
      });
    });

    test('Debe devolver 404 si el usuario existe pero no es administrador (id_rol !== 1)', async () => {
      const id = '10';
      const clienteMock = { 
        id_usuario: 10,
        numero_documento: '87654321',
        nombre: 'Cliente Regular',
        usuario: 'cliente1',
        id_rol: 3, // Rol de cliente, no admin
        estado: 'Activo'
      };
      
      Usuario.findByPk.mockResolvedValue(clienteMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerAdminPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
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
        numero_documento: '11223344',
        nombre: 'Técnico',
        usuario: 'tecnico1',
        id_rol: 2, // Rol de técnico
        estado: 'Activo'
      };
      
      Usuario.findByPk.mockResolvedValue(tecnicoMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerAdminPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Administrador no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerAdminPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe manejar correctamente el mensaje del error recibido', async () => {
      const id = '5';
      const dbError = new Error('Timeout exceeded');
      
      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerAdminPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Timeout exceeded'
      });
    });
  });
});