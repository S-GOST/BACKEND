// test/Pruebas unitarias/obtenerComprobantePorId.test.js

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
}), { virtual: true });

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerComprobantePorId } = require('../../controllers/comprobanteController.js');

// Referencia al modelo simulado
const Comprobante = require('../../models/comprobanteModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerComprobantePorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el comprobante si existe', async () => {
      const id = '5';
      const comprobanteMock = { 
        id_comprobante: 5, 
        tipo: 'Factura', 
        numero: 'F001-001', 
        fecha: '2024-02-15' 
      };
      
      Comprobante.findByPk.mockResolvedValue(comprobanteMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerComprobantePorId(req, res);

      expect(Comprobante.findByPk).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: comprobanteMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el comprobante no existe', async () => {
      const id = '999';
      
      Comprobante.findByPk.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerComprobantePorId(req, res);

      expect(Comprobante.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Comprobante no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Comprobante.findByPk.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerComprobantePorId(req, res);

      expect(Comprobante.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});