// test/Pruebas unitarias/pagarComprobante.test.js

// Mocks de modelos (con virtual: true para evitar errores de ruta)
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

// Mock de db.js (SIN virtual, necesitamos usar pool.query directamente)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

const { pagarComprobante } = require('../../controllers/comprobanteController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('pagarComprobante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Pago exitoso', () => {
    test('Debe pagar el comprobante y registrar el historial correctamente', async () => {
      const id = '5';
      const comprobanteMock = [
        { 
          id_comprobante: 5, 
          numero_comprobante: 'COMP-20240215-0001',
          estado: 'Pendiente',
          total_pagar: 150.50
        }
      ];
      const updateResult = { affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([comprobanteMock, []])  // SELECT del comprobante
        .mockResolvedValueOnce([updateResult, []]);    // UPDATE del estado

      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        user: { id_usuario: 10 } 
      };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM comprobante WHERE id_comprobante = ?',
        [id]
      );
      expect(pool.query).toHaveBeenNthCalledWith(2,
        'UPDATE comprobante SET estado = "Pagado" WHERE id_comprobante = ?',
        [id]
      );
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'comprobante',
        id,
        'UPDATE',
        'El cliente pagó el comprobante COMP-20240215-0001'
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comprobante pagado exitosamente'
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';
      const comprobanteMock = [
        { 
          id_comprobante: 6, 
          numero_comprobante: 'COMP-20240216-0002',
          estado: 'Pendiente'
        }
      ];
      const updateResult = { affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([comprobanteMock, []])
        .mockResolvedValueOnce([updateResult, []]);

      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'comprobante',
        id,
        'UPDATE',
        'El cliente pagó el comprobante COMP-20240216-0002'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comprobante pagado exitosamente'
      });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el comprobante no existe', async () => {
      const id = '999';

      pool.query.mockResolvedValueOnce([[], []]); // No encontrado

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM comprobante WHERE id_comprobante = ?',
        [id]
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Comprobante no encontrado'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 404 si el resultado del SELECT es null', async () => {
      const id = '999';

      pool.query.mockResolvedValueOnce([null, []]);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Comprobante no encontrado'
      });
    });
  });

  describe('Validaciones de estado (400)', () => {
    test('Debe devolver 400 si el comprobante ya fue pagado', async () => {
      const id = '5';
      const comprobanteMock = [
        { 
          id_comprobante: 5, 
          numero_comprobante: 'COMP-20240215-0001',
          estado: 'Pagado'
        }
      ];

      pool.query.mockResolvedValueOnce([comprobanteMock, []]);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(pool.query).toHaveBeenCalledTimes(1); // Solo el SELECT, no el UPDATE
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El comprobante ya no está pendiente'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 400 si el comprobante está cancelado', async () => {
      const id = '5';
      const comprobanteMock = [
        { 
          id_comprobante: 5, 
          numero_comprobante: 'COMP-20240215-0001',
          estado: 'Cancelado'
        }
      ];

      pool.query.mockResolvedValueOnce([comprobanteMock, []]);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El comprobante ya no está pendiente'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta SELECT', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión al buscar');

      pool.query.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de conexión al buscar'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta UPDATE', async () => {
      const id = '5';
      const comprobanteMock = [
        { 
          id_comprobante: 5, 
          numero_comprobante: 'COMP-20240215-0001',
          estado: 'Pendiente'
        }
      ];
      const dbError = new Error('Error al actualizar estado');

      pool.query
        .mockResolvedValueOnce([comprobanteMock, []]) // SELECT OK
        .mockRejectedValueOnce(dbError);              // UPDATE falla

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al actualizar estado'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const comprobanteMock = [
        { 
          id_comprobante: 5, 
          numero_comprobante: 'COMP-20240215-0001',
          estado: 'Pendiente'
        }
      ];
      const updateResult = { affectedRows: 1 };
      const logError = new Error('Error al registrar historial');

      pool.query
        .mockResolvedValueOnce([comprobanteMock, []])
        .mockResolvedValueOnce([updateResult, []]);

      logHistory.mockRejectedValue(logError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await pagarComprobante(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al registrar historial'
      });
    });
  });
});