// test/Pruebas unitarias/obtenerProductos.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/productosModel.js', () => ({
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
}));

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerProductos } = require('../../controllers/productosController.js');

// Referencia al modelo simulado
const Producto = require('../../models/productosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerProductos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de productos', async () => {
      const productosMock = [
        { id_producto: 1, nombre: 'Laptop HP', precio: 1200, stock: 10 },
        { id_producto: 2, nombre: 'Mouse Logitech', precio: 25, stock: 50 },
      ];
      Producto.findAll.mockResolvedValue(productosMock);

      const req = {};
      const res = mockRes();

      await obtenerProductos(req, res);

      expect(Producto.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: productosMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay productos', async () => {
      Producto.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerProductos(req, res);

      expect(Producto.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Producto.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerProductos(req, res);

      expect(Producto.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});