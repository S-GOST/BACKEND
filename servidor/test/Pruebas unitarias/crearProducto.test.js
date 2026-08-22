// test/Pruebas unitarias/crearProducto.test.js

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
const { crearProducto } = require('../../controllers/productosController.js');
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

describe('crearProducto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver 201 y registrar el producto creado', async () => {
      const bodyMock = { nombre: 'Laptop HP', precio: 1200, stock: 10, id_categoria: 3 };
      // En mysql2, create() retorna un objeto con insertId, no los datos completos
      const resultadoCreateMock = { insertId: 5, affectedRows: 1 };

      Producto.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await crearProducto(req, res);

      expect(Producto.create).toHaveBeenCalledWith(bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'productos',          // tabla
        5,                    // insertId
        'INSERT',             // acción
        'Se creó el producto Laptop HP'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: resultadoCreateMock });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { nombre: 'Mouse Logitech', precio: 25, stock: 50 };
      const resultadoCreateMock = { insertId: 6, affectedRows: 1 };

      Producto.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearProducto(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'productos',
        6,
        'INSERT',
        'Se creó el producto Mouse Logitech'
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe usar "N/A" si el nombre no viene en el body', async () => {
      const bodyMock = { precio: 100, stock: 5 };
      const resultadoCreateMock = { insertId: 7, affectedRows: 1 };

      Producto.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 2 } };
      const res = mockRes();

      await crearProducto(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        2,
        'productos',
        7,
        'INSERT',
        'Se creó el producto N/A'
      );
    });

    test('Debe usar 0 como insertId si no está disponible', async () => {
      const bodyMock = { nombre: 'Teclado' };
      const resultadoCreateMock = { affectedRows: 1 }; // Sin insertId

      Producto.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 4 } };
      const res = mockRes();

      await crearProducto(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        4,
        'productos',
        0,                    // Fallback: 0
        'INSERT',
        'Se creó el producto Teclado'
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el nombre ya existe (ER_DUP_ENTRY)', async () => {
      const bodyMock = { nombre: 'Existente' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Producto.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre del producto ya existe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { nombre: 'Error' };
      const dbError = new Error('Error de conexión a la BD');

      Producto.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});