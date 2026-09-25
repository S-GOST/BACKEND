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

// Mock de prisma
jest.mock('../../config/prisma.js', () => ({
  __esModule: true,
  default: {
    detalles_orden_servicio: {
      deleteMany: jest.fn()
    }
  }
}), { virtual: true });

const { eliminarOrden } = require('../../controllers/ordenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const OrdenServicio = require('../../models/ordenServicioModel.js').default;
const prisma = require('../../config/prisma.js').default;

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

      expect(OrdenServicio.findById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID_ORDEN_SERVICIO es requerido'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la orden no existe', async () => {
      const id = '999';
      
      OrdenServicio.findById.mockResolvedValue(null);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(OrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(prisma.detalles_orden_servicio.deleteMany).not.toHaveBeenCalled();
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
      const ordenMock = { ID_ORDEN_SERVICIO: 5 };
      
      OrdenServicio.findById.mockResolvedValue(ordenMock);
      prisma.detalles_orden_servicio.deleteMany.mockResolvedValue({ count: 2 });
      OrdenServicio.delete.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(OrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(prisma.detalles_orden_servicio.deleteMany).toHaveBeenCalledWith({
        where: { id_orden: Number(id) }
      });
      expect(OrdenServicio.delete).toHaveBeenCalledWith(id);
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
      const ordenMock = { ID_ORDEN_SERVICIO: 5 };
      
      OrdenServicio.findById.mockResolvedValue(ordenMock);
      prisma.detalles_orden_servicio.deleteMany.mockResolvedValue({ count: 2 });
      OrdenServicio.delete.mockResolvedValue({ affectedRows: 1 });
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
    test('Debe devolver 500 si falla findById', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión en SELECT');
      
      OrdenServicio.findById.mockRejectedValue(dbError);

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
      const ordenMock = { ID_ORDEN_SERVICIO: 5 };
      const dbError = new Error('Error al eliminar detalles');
      
      OrdenServicio.findById.mockResolvedValue(ordenMock);
      prisma.detalles_orden_servicio.deleteMany.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(OrdenServicio.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar detalles'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la eliminación de la orden', async () => {
      const id = '5';
      const ordenMock = { ID_ORDEN_SERVICIO: 5 };
      const dbError = new Error('Error al eliminar orden');
      
      OrdenServicio.findById.mockResolvedValue(ordenMock);
      prisma.detalles_orden_servicio.deleteMany.mockResolvedValue({ count: 2 });
      OrdenServicio.delete.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar orden'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});