// test/Pruebas unitarias/actualizarProducto.test.js

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
const { actualizarProducto } = require('../../controllers/productosController.js');
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

describe('actualizarProducto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver 200 y registrar la actualización correctamente', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Laptop HP Pro', precio: 1500, stock: 15 };
      const resultadoUpdateMock = { affectedRows: 1 };

      Producto.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await actualizarProducto(req, res);

      expect(Producto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'productos',          // tabla
        id,                   // id del producto (string)
        'UPDATE',             // acción
        `Se actualizó el producto ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: resultadoUpdateMock });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';
      const bodyMock = { nombre: 'Mouse Actualizado', precio: 30 };
      const resultadoUpdateMock = { affectedRows: 1 };

      Producto.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarProducto(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'productos',
        id,
        'UPDATE',
        `Se actualizó el producto ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: resultadoUpdateMock });
    });
  });

  describe('Validación de entrada', () => {
    test('Debe devolver 400 si el ID no es proporcionado', async () => {
      const bodyMock = { nombre: 'Producto Sin ID' };

      const req = { params: {}, body: bodyMock }; // Sin id en params
      const res = mockRes();

      await actualizarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID del producto no proporcionado'
      });
      expect(Producto.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el producto no existe (affectedRows === 0)', async () => {
      const id = '999';
      const bodyMock = { nombre: 'Inexistente' };
      const resultadoUpdateMock = { affectedRows: 0 };

      Producto.update.mockResolvedValue(resultadoUpdateMock);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarProducto(req, res);

      expect(Producto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Producto no encontrado'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el nombre ya existe (ER_DUP_ENTRY)', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Existente' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Producto.update.mockRejectedValue(duplicateError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre del producto ya existe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Error' };
      const dbError = new Error('Error de conexión a la BD');

      Producto.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});