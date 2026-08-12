// test/obtenerClientePorId.test.js

const { obtenerClientePorId } = require('../controllers/clientesController.js');

// 1. Mocks (se elevan automáticamente al inicio en CJS)
jest.mock('../models/usuarioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOneWithPassword: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Referencias a los módulos simulados
const Usuario = require('../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerClientePorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver el cliente cuando existe y es rol 3', async () => {
      const idMock = '12345678';
      const userMock = { id_usuario: 1, nombre: 'Juan Pérez', id_rol: 3 };

      Usuario.findByPk.mockResolvedValue(userMock);

      const req = { params: { id: idMock } };
      const res = mockRes();

      await obtenerClientePorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(idMock);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: userMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 404 si el usuario no existe', async () => {
      Usuario.findByPk.mockResolvedValue(null);

      const req = { params: { id: '12345678' } };
      const res = mockRes();

      await obtenerClientePorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cliente no encontrado',
      });
    });

    test('Debe devolver 404 si el usuario encontrado no es rol 3', async () => {
      const userMock = { id_usuario: 5, nombre: 'Admin', id_rol: 1 };
      Usuario.findByPk.mockResolvedValue(userMock);

      const req = { params: { id: '12345678' } };
      const res = mockRes();

      await obtenerClientePorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cliente no encontrado',
      });
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { params: { id: '12345678' } };
      const res = mockRes();

      await obtenerClientePorId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});