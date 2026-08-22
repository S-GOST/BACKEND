// test/Pruebas unitarias/eliminarProducto.test.js

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

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador y el logger simulado
const { eliminarProducto } = require('../../controllers/productosController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const Producto = require('../../models/productosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarProducto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe devolver 200 y registrar la eliminación correctamente', async () => {
      const id = '5';

      Producto.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 3 } };
      const res = mockRes();

      await eliminarProducto(req, res);

      expect(Producto.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'productos',          // tabla
        id,                   // id del producto (string)
        'DELETE',             // acción
        `Se eliminó el producto ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Producto eliminado correctamente' 
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';

      Producto.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarProducto(req, res);

      expect(Producto.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'productos',
        id,
        'DELETE',
        `Se eliminó el producto ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Producto eliminado correctamente' 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la eliminación en la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');

      Producto.delete.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 1 } };
      const res = mockRes();

      await eliminarProducto(req, res);

      expect(Producto.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});