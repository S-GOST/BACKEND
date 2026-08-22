// test/Pruebas unitarias/obtenerAdmins.test.js

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
const { obtenerAdmins } = require('../../controllers/adminController.js');

// Referencia al modelo simulado
const Usuario = require('../../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerAdmins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de administradores', async () => {
      const adminsMock = [
        { 
          id_usuario: 1, 
          numero_documento: '12345678',
          nombre: 'Admin Principal',
          usuario: 'admin1',
          correo: 'admin1@sistema.com',
          telefono: '3001234567',
          id_rol: 1,
          estado: 'Activo'
        },
        { 
          id_usuario: 2, 
          numero_documento: '87654321',
          nombre: 'Admin Secundario',
          usuario: 'admin2',
          correo: 'admin2@sistema.com',
          telefono: '3009876543',
          id_rol: 1,
          estado: 'Activo'
        },
      ];
      
      Usuario.findAll.mockResolvedValue(adminsMock);

      const req = {};
      const res = mockRes();

      await obtenerAdmins(req, res);

      // Validar que se llamó con el filtro correcto de administradores
      expect(Usuario.findAll).toHaveBeenCalledWith({ 
        where: { id_rol: 1 } 
      });
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: adminsMock 
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay administradores', async () => {
      Usuario.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerAdmins(req, res);

      expect(Usuario.findAll).toHaveBeenCalledWith({ 
        where: { id_rol: 1 } 
      });
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: [] 
      });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Usuario.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerAdmins(req, res);

      expect(Usuario.findAll).toHaveBeenCalledWith({ 
        where: { id_rol: 1 } 
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });

    test('Debe manejar correctamente el mensaje del error recibido', async () => {
      const dbError = new Error('Timeout exceeded');
      Usuario.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerAdmins(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Timeout exceeded',
      });
    });
  });
});