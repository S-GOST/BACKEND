// test/Pruebas unitarias/eliminarDetalleOrden.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/detalleOrdenServicioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
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

// 🛡️ Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador y el logger simulado
const { eliminarDetalleOrden } = require('../../controllers/detalleOrdenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const DetalleOrdenServicio = require('../../models/detalleOrdenServicioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarDetalleOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de entrada (400)', () => {
    test('Debe devolver 400 si no se proporciona ID ni en params ni en body', async () => {
      const req = { params: {}, body: {} };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID requerido para eliminar'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Eliminación exitosa', () => {
    test('Debe usar el ID de params si está presente', async () => {
      const id = '5';
      const eliminadosMock = { affectedRows: 1 };

      DetalleOrdenServicio.delete.mockResolvedValue(eliminadosMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: {},
        user: { id_usuario: 10 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'detalles_orden_servicio',
        id,
        'DELETE',
        `Se eliminó el detalle ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Detalle eliminado correctamente'
      });
    });

    test('Debe usar ID_DETALLES_ORDEN_SERVICIO del body como fallback si params.id no existe', async () => {
      const idDesdeBody = '7';
      const eliminadosMock = { affectedRows: 1 };

      DetalleOrdenServicio.delete.mockResolvedValue(eliminadosMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: {}, // Sin id en params
        body: { ID_DETALLES_ORDEN_SERVICIO: idDesdeBody }, 
        user: { id_usuario: 5 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      // Debe usar el ID del body
      expect(DetalleOrdenServicio.delete).toHaveBeenCalledWith(idDesdeBody);
      expect(logHistory).toHaveBeenCalledWith(
        5,
        'detalles_orden_servicio',
        idDesdeBody,
        'DELETE',
        `Se eliminó el detalle ID ${idDesdeBody}`
      );
    });

    test('Debe priorizar params.id sobre body.ID_DETALLES_ORDEN_SERVICIO', async () => {
      const idParams = '5';
      const idBody = '999';
      const eliminadosMock = { affectedRows: 1 };

      DetalleOrdenServicio.delete.mockResolvedValue(eliminadosMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id: idParams }, 
        body: { ID_DETALLES_ORDEN_SERVICIO: idBody }, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      // Debe usar el ID de params (no el del body)
      expect(DetalleOrdenServicio.delete).toHaveBeenCalledWith(idParams);
      expect(DetalleOrdenServicio.delete).not.toHaveBeenCalledWith(idBody);
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '5';
      const eliminadosMock = { affectedRows: 1 };

      DetalleOrdenServicio.delete.mockResolvedValue(eliminadosMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: {} }; // Sin req.user
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'detalles_orden_servicio',
        id,
        'DELETE',
        `Se eliminó el detalle ID ${id}`
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si affectedRows es 0', async () => {
      const id = '999';
      const eliminadosMock = { affectedRows: 0 };

      DetalleOrdenServicio.delete.mockResolvedValue(eliminadosMock);

      const req = { 
        params: { id }, 
        body: {},
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Detalle no encontrado'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la eliminación en la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');

      DetalleOrdenServicio.delete.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: {},
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const eliminadosMock = { affectedRows: 1 };
      const logError = new Error('Error al registrar historial');

      DetalleOrdenServicio.delete.mockResolvedValue(eliminadosMock);
      logHistory.mockRejectedValue(logError);

      const req = { 
        params: { id }, 
        body: {},
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al registrar historial'
      });
    });

    test('Debe capturar el error en console.error con el prefijo correcto', async () => {
      const id = '5';
      const dbError = new Error('Error específico');
      const consoleSpy = jest.spyOn(console, 'error');

      DetalleOrdenServicio.delete.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: {},
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await eliminarDetalleOrden(req, res);

      expect(consoleSpy).toHaveBeenCalledWith("Error al eliminar:", dbError);
    });
  });
});