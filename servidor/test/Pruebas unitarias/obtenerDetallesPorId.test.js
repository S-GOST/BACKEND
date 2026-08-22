// test/Pruebas unitarias/obtenerDetallesPorId.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/detalleOrdenServicioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(), // 🔧 Añadido específicamente para esta función
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
const { obtenerDetallesPorId } = require('../../controllers/detalleOrdenServicioController.js');

// Referencia al modelo simulado
const DetalleOrdenServicio = require('../../models/detalleOrdenServicioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerDetallesPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de entrada (400)', () => {
    test('Debe devolver 400 si no se proporciona idOrden ni id', async () => {
      const req = { params: {} }; // Sin ningún ID
      const res = mockRes();

      await obtenerDetallesPorId(req, res);

      expect(DetalleOrdenServicio.findByOrderId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Falta el ID para buscar'
      });
    });
  });

  describe('Consulta exitosa', () => {
    test('Debe usar idOrden si está presente en req.params', async () => {
      const idOrden = '10';
      const detallesMock = [
        { id_detalle: 1, id_orden: 10, ID_SERVICIOS: 5, cantidad: 2, subtotal: 100 },
        { id_detalle: 2, id_orden: 10, ID_PRODUCTOS: 3, cantidad: 1, subtotal: 25 }
      ];

      DetalleOrdenServicio.findByOrderId.mockResolvedValue(detallesMock);

      const req = { params: { idOrden } };
      const res = mockRes();

      await obtenerDetallesPorId(req, res);

      expect(DetalleOrdenServicio.findByOrderId).toHaveBeenCalledWith(idOrden);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: detallesMock });
    });

    test('Debe usar id como fallback si idOrden no está presente', async () => {
      const id = '15';
      const detallesMock = [
        { id_detalle: 3, id_orden: 15, ID_SERVICIOS: 7, cantidad: 1, subtotal: 80 }
      ];

      DetalleOrdenServicio.findByOrderId.mockResolvedValue(detallesMock);

      const req = { params: { id } }; // Sin idOrden, solo id
      const res = mockRes();

      await obtenerDetallesPorId(req, res);

      expect(DetalleOrdenServicio.findByOrderId).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: detallesMock });
    });

    test('Debe priorizar idOrden sobre id si ambos están presentes', async () => {
      const idOrden = '10';
      const id = '999';
      const detallesMock = [];

      DetalleOrdenServicio.findByOrderId.mockResolvedValue(detallesMock);

      const req = { params: { idOrden, id } }; // Ambos presentes
      const res = mockRes();

      await obtenerDetallesPorId(req, res);

      // Debe usar idOrden (no id)
      expect(DetalleOrdenServicio.findByOrderId).toHaveBeenCalledWith(idOrden);
      expect(DetalleOrdenServicio.findByOrderId).not.toHaveBeenCalledWith(id);
    });

    test('Debe devolver 200 y array vacío si no hay detalles para la orden', async () => {
      const idOrden = '20';

      DetalleOrdenServicio.findByOrderId.mockResolvedValue([]);

      const req = { params: { idOrden } };
      const res = mockRes();

      await obtenerDetallesPorId(req, res);

      expect(DetalleOrdenServicio.findByOrderId).toHaveBeenCalledWith(idOrden);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const idOrden = '10';
      const dbError = new Error('Error de conexión a la BD');

      DetalleOrdenServicio.findByOrderId.mockRejectedValue(dbError);

      const req = { params: { idOrden } };
      const res = mockRes();

      await obtenerDetallesPorId(req, res);

      expect(DetalleOrdenServicio.findByOrderId).toHaveBeenCalledWith(idOrden);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de conexión a la BD'
      });
    });
  });
});