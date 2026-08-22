// test/Pruebas unitarias/obtenerMotoPorId.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/motosModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    findByCliente: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerMotoPorId } = require('../../controllers/motosController.js');

// Referencia al modelo simulado
const Moto = require('../../models/motosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerMotoPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la moto si existe', async () => {
      const id = '5';
      const motoMock = { 
        id_moto: 5, 
        placa: 'ABC-123', 
        marca: 'Yamaha', 
        modelo: 'FZ',
        cilindraje: 150,
        kilometraje: 5000,
        id_cliente: 10
      };
      
      Moto.findById.mockResolvedValue(motoMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerMotoPorId(req, res);

      expect(Moto.findById).toHaveBeenCalledWith(id);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: motoMock });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la moto no existe', async () => {
      const id = '999';
      
      Moto.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerMotoPorId(req, res);

      expect(Moto.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Moto no encontrada'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Moto.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerMotoPorId(req, res);

      expect(Moto.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});