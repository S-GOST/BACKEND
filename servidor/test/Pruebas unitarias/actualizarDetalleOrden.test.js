// test/Pruebas unitarias/actualizarDetalleOrden.test.js

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
const { actualizarDetalleOrden } = require('../../controllers/detalleOrdenServicioController.js');
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

describe('actualizarDetalleOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de entrada (400)', () => {
    test('Debe devolver 400 si no se proporciona ID ni en params ni en body', async () => {
      const req = { params: {}, body: { cantidad: 2 } };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El ID del detalle es requerido'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Actualización exitosa', () => {
    test('Debe usar el ID de params si está presente', async () => {
      const id = '5';
      const bodyMock = { cantidad: 3, precio_unitario: 60 };
      const resultadoMock = { affectedRows: 1 };

      DetalleOrdenServicio.update.mockResolvedValue(resultadoMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 10 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'detalles_orden_servicio',
        id,
        'UPDATE',
        `Se actualizó el detalle ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Detalle actualizado correctamente'
      });
    });

    test('Debe usar ID_DETALLES_ORDEN_SERVICIO del body como fallback si params.id no existe', async () => {
      const idDesdeBody = '7';
      const bodyMock = { 
        ID_DETALLES_ORDEN_SERVICIO: idDesdeBody, 
        cantidad: 2,
        Garantia: '6 meses'
      };
      const resultadoMock = { affectedRows: 1 };

      DetalleOrdenServicio.update.mockResolvedValue(resultadoMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: {}, // Sin id en params
        body: bodyMock, 
        user: { id_usuario: 5 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      // Debe usar el ID del body
      expect(DetalleOrdenServicio.update).toHaveBeenCalledWith(
        idDesdeBody, 
        { cantidad: 2, Garantia: '6 meses' } // Sin ID_DETALLES_ORDEN_SERVICIO (fue extraído)
      );
      expect(logHistory).toHaveBeenCalledWith(
        5,
        'detalles_orden_servicio',
        idDesdeBody,
        'UPDATE',
        `Se actualizó el detalle ID ${idDesdeBody}`
      );
    });

    test('Debe excluir ID_DETALLES_ORDEN_SERVICIO del objeto enviado al update', async () => {
      const id = '5';
      const bodyMock = { 
        ID_DETALLES_ORDEN_SERVICIO: 999, // Este debe ser excluido
        cantidad: 2,
        precio_unitario: 50
      };
      const resultadoMock = { affectedRows: 1 };

      DetalleOrdenServicio.update.mockResolvedValue(resultadoMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      // El update debe recibir solo cantidad y precio_unitario
      expect(DetalleOrdenServicio.update).toHaveBeenCalledWith(id, {
        cantidad: 2,
        precio_unitario: 50
      });
      expect(DetalleOrdenServicio.update).not.toHaveBeenCalledWith(
        id,
        expect.objectContaining({ ID_DETALLES_ORDEN_SERVICIO: 999 })
      );
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '5';
      const bodyMock = { cantidad: 1 };
      const resultadoMock = { affectedRows: 1 };

      DetalleOrdenServicio.update.mockResolvedValue(resultadoMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'detalles_orden_servicio',
        id,
        'UPDATE',
        `Se actualizó el detalle ID ${id}`
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si affectedRows es 0', async () => {
      const id = '999';
      const bodyMock = { cantidad: 2 };
      const resultadoMock = { affectedRows: 0 };

      DetalleOrdenServicio.update.mockResolvedValue(resultadoMock);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Detalle no encontrado'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la actualización en la base de datos', async () => {
      const id = '5';
      const bodyMock = { cantidad: 2 };
      const dbError = new Error('Error de conexión a la BD');

      DetalleOrdenServicio.update.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(DetalleOrdenServicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const bodyMock = { cantidad: 2 };
      const resultadoMock = { affectedRows: 1 };
      const logError = new Error('Error al registrar historial');

      DetalleOrdenServicio.update.mockResolvedValue(resultadoMock);
      logHistory.mockRejectedValue(logError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al registrar historial'
      });
    });

    test('Debe capturar el error en console.error con el prefijo correcto', async () => {
      const id = '5';
      const bodyMock = { cantidad: 2 };
      const dbError = new Error('Error específico');
      const consoleSpy = jest.spyOn(console, 'error');

      DetalleOrdenServicio.update.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarDetalleOrden(req, res);

      expect(consoleSpy).toHaveBeenCalledWith("Error al actualizar:", dbError);
    });
  });
});