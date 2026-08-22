// test/Pruebas unitarias/obtenerComprobantes.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/comprobanteModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true }); // Evita errores de "Cannot find module"

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerComprobantes } = require('../../controllers/comprobanteController.js');

// Referencia al modelo simulado
const Comprobante = require('../../models/comprobanteModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerComprobantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de comprobantes', async () => {
      const comprobantesMock = [
        { id_comprobante: 1, tipo: 'Factura', numero: 'F001-001', fecha: '2024-02-15' },
        { id_comprobante: 2, tipo: 'Boleta', numero: 'B001-005', fecha: '2024-02-16' },
      ];
      Comprobante.findAll.mockResolvedValue(comprobantesMock);

      const req = {};
      const res = mockRes();

      await obtenerComprobantes(req, res);

      expect(Comprobante.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: comprobantesMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay comprobantes', async () => {
      Comprobante.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerComprobantes(req, res);

      expect(Comprobante.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Comprobante.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerComprobantes(req, res);

      expect(Comprobante.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});