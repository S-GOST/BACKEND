// test/Pruebas unitarias/obtenerDetalleOrdenPorId.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/detalleOrdenServicioModel.js', () => ({
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
const { obtenerDetalleOrdenPorId } = require('../../controllers/detalleOrdenServicioController.js');

// Referencia al modelo simulado
const DetalleOrdenServicio = require('../../models/detalleOrdenServicioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerDetalleOrdenPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el detalle si existe', async () => {
      const id = '5';
      const detalleMock = [
        { 
          id_detalle: 5, 
          id_orden: 10, 
          ID_SERVICIOS: 3, 
          cantidad: 2, 
          precio_unitario: 50, 
          subtotal: 100 
        }
      ];
      
      DetalleOrdenServicio.findById.mockResolvedValue(detalleMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerDetalleOrdenPorId(req, res);

      expect(DetalleOrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: detalleMock });
    });

    test('Debe devolver 200 y el detalle como objeto si el modelo retorna un objeto', async () => {
      const id = '5';
      const detalleMock = { 
        id_detalle: 5, 
        id_orden: 10, 
        ID_SERVICIOS: 3, 
        cantidad: 2, 
        precio_unitario: 50, 
        subtotal: 100 
      };
      
      DetalleOrdenServicio.findById.mockResolvedValue(detalleMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerDetalleOrdenPorId(req, res);

      expect(DetalleOrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: detalleMock });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el detalle es null', async () => {
      const id = '999';
      
      DetalleOrdenServicio.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerDetalleOrdenPorId(req, res);

      expect(DetalleOrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Detalle no encontrado'
      });
    });

    test('Debe devolver 404 si el detalle es un array vacío', async () => {
      const id = '999';
      
      DetalleOrdenServicio.findById.mockResolvedValue([]);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerDetalleOrdenPorId(req, res);

      expect(DetalleOrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Detalle no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      DetalleOrdenServicio.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerDetalleOrdenPorId(req, res);

      expect(DetalleOrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});