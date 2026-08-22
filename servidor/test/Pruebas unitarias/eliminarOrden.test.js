// test/Pruebas unitarias/eliminarOrden.test.js

// 1. Mocks de modelos (con virtual: true)
jest.mock('../../models/ordenServicioModel.js', () => ({
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

// 2. Mock de db.js (SIN virtual, necesitamos usar pool.query directamente)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

const { eliminarOrden } = require('../../controllers/ordenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de entrada', () => {
    test('Debe devolver 400 si no se proporciona ID', async () => {
      const req = { params: {} }; // Sin id
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID_ORDEN_SERVICIO es requerido'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Búsqueda de orden', () => {
    test('Debe encontrar la orden usando ID_ORDEN_SERVICIO', async () => {
      const id = '5';
      const ordenMock = [{ ID_ORDEN_SERVICIO: 5, estado: 'Pendiente' }];
      
      pool.query
        .mockResolvedValueOnce([ordenMock, []])      // SELECT por ID_ORDEN_SERVICIO
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // DELETE detalles
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // DELETE orden

      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?',
        [id]
      );
      expect(pool.query).toHaveBeenCalledTimes(3); // SELECT + 2 DELETEs
    });

    test('Debe usar fallback a id_orden si ID_ORDEN_SERVICIO no encuentra', async () => {
      const id = '5';
      const ordenMock = [{ id_orden: 5, estado: 'Pendiente' }];
      
      pool.query
        .mockResolvedValueOnce([[], []])              // SELECT por ID_ORDEN_SERVICIO (vacío)
        .mockResolvedValueOnce([ordenMock, []])       // SELECT por id_orden (encontrado)
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // DELETE detalles
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // DELETE orden

      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?',
        [id]
      );
      expect(pool.query).toHaveBeenNthCalledWith(2,
        'SELECT * FROM orden_servicio WHERE id_orden = ?',
        [id]
      );
      expect(pool.query).toHaveBeenCalledTimes(4); // 2 SELECTs + 2 DELETEs
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la orden no existe en ninguna columna', async () => {
      const id = '999';
      
      pool.query
        .mockResolvedValueOnce([[], []])  // SELECT por ID_ORDEN_SERVICIO (vacío)
        .mockResolvedValueOnce([[], []]); // SELECT por id_orden (vacío)

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2); // Solo los 2 SELECTs
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Orden de servicio no encontrada'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Eliminación exitosa', () => {
    test('Debe eliminar detalles y orden correctamente con req.user presente', async () => {
      const id = '5';
      const ordenMock = [{ ID_ORDEN_SERVICIO: 5 }];
      
      pool.query
        .mockResolvedValueOnce([ordenMock, []])             // 1. SELECT orden
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])   // 2. DELETE detalles
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);  // 3. DELETE orden

      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      // CORREGIDO: Las llamadas son la 2 y la 3 (no 3 y 4)
      expect(pool.query).toHaveBeenNthCalledWith(2,
        'DELETE FROM detalles_orden_servicio WHERE id_orden = ?',
        [id]
      );
      expect(pool.query).toHaveBeenNthCalledWith(3,
        'DELETE FROM orden_servicio WHERE ID_ORDEN_SERVICIO = ?',
        [id]
      );
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'orden_servicio',
        id,
        'DELETE',
        `Se eliminó la orden de servicio #${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Orden de servicio eliminada correctamente'
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '5';
      const ordenMock = [{ ID_ORDEN_SERVICIO: 5 }];
      
      pool.query
        .mockResolvedValueOnce([ordenMock, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'orden_servicio',
        id,
        'DELETE',
        `Se eliminó la orden de servicio #${id}`
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la primera consulta SELECT', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión en SELECT');
      
      pool.query.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión en SELECT'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la eliminación de detalles', async () => {
      const id = '5';
      const ordenMock = [{ ID_ORDEN_SERVICIO: 5 }];
      const dbError = new Error('Error al eliminar detalles');
      
      pool.query
        .mockResolvedValueOnce([ordenMock, []])
        .mockRejectedValueOnce(dbError); // DELETE detalles falla

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2); // SELECT + DELETE detalles
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar detalles'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la eliminación de la orden', async () => {
      const id = '5';
      const ordenMock = [{ ID_ORDEN_SERVICIO: 5 }];
      const dbError = new Error('Error al eliminar orden');
      
      pool.query
        .mockResolvedValueOnce([ordenMock, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockRejectedValueOnce(dbError); // DELETE orden falla

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar orden'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const ordenMock = [{ ID_ORDEN_SERVICIO: 5 }];
      const logError = new Error('Error al registrar historial');
      
      pool.query
        .mockResolvedValueOnce([ordenMock, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockRejectedValue(logError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al registrar historial'
      });
    });
  });
});