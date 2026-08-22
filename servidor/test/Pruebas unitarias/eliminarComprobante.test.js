// test/Pruebas unitarias/eliminarComprobante.test.js

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
const { eliminarComprobante } = require('../../controllers/comprobanteController.js');
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

describe('eliminarComprobante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe devolver 200 y registrar la eliminación correctamente', async () => {
      const id = '5';

      Comprobante.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 3 } };
      const res = mockRes();

      await eliminarComprobante(req, res);

      expect(Comprobante.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'comprobante',        // tabla en singular
        id,                   // id del comprobante (string)
        'DELETE',             // acción
        `Se eliminó el comprobante ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Comprobante eliminado correctamente' 
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';

      Comprobante.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarComprobante(req, res);

      expect(Comprobante.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'comprobante',
        id,
        'DELETE',
        `Se eliminó el comprobante ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Comprobante eliminado correctamente' 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la eliminación en la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');

      Comprobante.delete.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 1 } };
      const res = mockRes();

      await eliminarComprobante(req, res);

      expect(Comprobante.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});