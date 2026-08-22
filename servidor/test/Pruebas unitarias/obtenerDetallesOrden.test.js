// test/Pruebas unitarias/obtenerDetallesOrden.test.js

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
const { obtenerDetallesOrden } = require('../../controllers/detalleOrdenServicioController.js');

// Referencia al modelo simulado
const DetalleOrdenServicio = require('../../models/detalleOrdenServicioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerDetallesOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de detalles de orden', async () => {
      const detallesMock = [
        { id_detalle: 1, id_orden: 5, ID_SERVICIOS: 10, cantidad: 2, precio_unitario: 50, subtotal: 100 },
        { id_detalle: 2, id_orden: 5, ID_PRODUCTOS: 3, cantidad: 1, precio_unitario: 25, subtotal: 25 },
      ];
      DetalleOrdenServicio.findAll.mockResolvedValue(detallesMock);

      const req = {};
      const res = mockRes();

      await obtenerDetallesOrden(req, res);

      expect(DetalleOrdenServicio.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: detallesMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay detalles', async () => {
      DetalleOrdenServicio.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerDetallesOrden(req, res);

      expect(DetalleOrdenServicio.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      DetalleOrdenServicio.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerDetallesOrden(req, res);

      expect(DetalleOrdenServicio.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});