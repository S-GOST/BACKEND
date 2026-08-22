// test/Pruebas unitarias/crearComprobante.test.js

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

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador y el logger simulado
const { crearComprobante } = require('../../controllers/comprobanteController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const Comprobante = require('../../models/comprobanteModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearComprobante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver 200 y registrar el comprobante creado', async () => {
      const bodyMock = { tipo: 'Factura', numero: 'F001-001', fecha: '2024-02-15' };
      // mysql2 create retorna { insertId, affectedRows }
      const nuevoComprobanteMock = { insertId: 5, affectedRows: 1 };

      Comprobante.create.mockResolvedValue(nuevoComprobanteMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await crearComprobante(req, res);

      expect(Comprobante.create).toHaveBeenCalledWith(bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'comprobante',        // tabla en singular
        5,                    // insertId
        'INSERT',             // acción
        'Se creó un comprobante' // mensaje fijo (sin datos del body)
      );
      expect(res.status).not.toHaveBeenCalled(); // No usa status(201)
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: nuevoComprobanteMock 
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { tipo: 'Boleta', numero: 'B001-001' };
      const nuevoComprobanteMock = { insertId: 6, affectedRows: 1 };

      Comprobante.create.mockResolvedValue(nuevoComprobanteMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearComprobante(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'comprobante',
        6,
        'INSERT',
        'Se creó un comprobante'
      );
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: nuevoComprobanteMock 
      });
    });

    test('Debe usar 0 como insertId si no está disponible', async () => {
      const bodyMock = { tipo: 'Nota de Venta' };
      const nuevoComprobanteMock = { affectedRows: 1 }; // Sin insertId

      Comprobante.create.mockResolvedValue(nuevoComprobanteMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 2 } };
      const res = mockRes();

      await crearComprobante(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        2,
        'comprobante',
        0,                    // Fallback: 0
        'INSERT',
        'Se creó un comprobante'
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { tipo: 'Factura' };
      const dbError = new Error('Error de conexión a la BD');

      Comprobante.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearComprobante(req, res);

      expect(Comprobante.create).toHaveBeenCalledWith(bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});