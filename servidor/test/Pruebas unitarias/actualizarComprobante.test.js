// test/Pruebas unitarias/actualizarComprobante.test.js

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
const { actualizarComprobante } = require('../../controllers/comprobanteController.js');
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

describe('actualizarComprobante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver 200 y registrar la actualización correctamente', async () => {
      const id = '5';
      const bodyMock = { tipo: 'Factura Actualizada', numero: 'F001-002' };
      const resultadoUpdateMock = { affectedRows: 1 };

      Comprobante.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await actualizarComprobante(req, res);

      expect(Comprobante.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'comprobante',        // tabla en singular
        id,                   // id como string
        'UPDATE',             // acción
        `Se actualizó el comprobante ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: resultadoUpdateMock 
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';
      const bodyMock = { tipo: 'Boleta Actualizada' };
      const resultadoUpdateMock = { affectedRows: 1 };

      Comprobante.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarComprobante(req, res);

      expect(Comprobante.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'comprobante',
        id,
        'UPDATE',
        `Se actualizó el comprobante ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: resultadoUpdateMock 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la actualización en la base de datos', async () => {
      const id = '5';
      const bodyMock = { tipo: 'Factura' };
      const dbError = new Error('Error de conexión a la BD');

      Comprobante.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarComprobante(req, res);

      expect(Comprobante.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});