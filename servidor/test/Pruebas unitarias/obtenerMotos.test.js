// test/Pruebas unitarias/obtenerMotos.test.js

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
const { obtenerMotos } = require('../../controllers/motosController.js');

// Referencia al modelo simulado
const Moto = require('../../models/motosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerMotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de motos', async () => {
      const motosMock = [
        { id_moto: 1, placa: 'ABC-123', marca: 'Yamaha', modelo: 'FZ', id_cliente: 10 },
        { id_moto: 2, placa: 'XYZ-789', marca: 'Honda', modelo: 'CBR', id_cliente: 15 },
      ];
      Moto.findAll.mockResolvedValue(motosMock);

      const req = {};
      const res = mockRes();

      await obtenerMotos(req, res);

      expect(Moto.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: motosMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay motos', async () => {
      Moto.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerMotos(req, res);

      expect(Moto.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Moto.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerMotos(req, res);

      expect(Moto.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});