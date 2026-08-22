// test/Pruebas unitarias/obtenerProductosPorCategoria.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/productosModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCategoria: jest.fn(), 
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
const { obtenerProductosPorCategoria } = require('../../controllers/productosController.js');

// Referencia al modelo simulado
const Producto = require('../../models/productosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerProductosPorCategoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y los productos filtrados por categoría', async () => {
      const idCategoria = '3';
      const productosMock = [
        { id_producto: 1, nombre: 'Laptop HP', id_categoria: 3, precio: 1200 },
        { id_producto: 2, nombre: 'Monitor Dell', id_categoria: 3, precio: 300 },
      ];
      
      Producto.findByCategoria.mockResolvedValue(productosMock);

      const req = { params: { idCategoria } };
      const res = mockRes();

      await obtenerProductosPorCategoria(req, res);

      expect(Producto.findByCategoria).toHaveBeenCalledWith(idCategoria);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: productosMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y un arreglo vacío si no hay productos en esa categoría', async () => {
      const idCategoria = '99';
      
      Producto.findByCategoria.mockResolvedValue([]);

      const req = { params: { idCategoria } };
      const res = mockRes();

      await obtenerProductosPorCategoria(req, res);

      expect(Producto.findByCategoria).toHaveBeenCalledWith(idCategoria);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const idCategoria = '3';
      const dbError = new Error('Error de conexión a la BD');
      
      Producto.findByCategoria.mockRejectedValue(dbError);

      const req = { params: { idCategoria } };
      const res = mockRes();

      await obtenerProductosPorCategoria(req, res);

      expect(Producto.findByCategoria).toHaveBeenCalledWith(idCategoria);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});