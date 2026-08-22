// test/Pruebas unitarias/crearCategoria.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/categoriasModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByTipo: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
const { crearCategoria } = require('../../controllers/categoriasController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const Categoria = require('../../models/categoriasModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearCategoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver 201 y registrar la categoría creada', async () => {
      const bodyMock = { nombre: 'Electrónica', descripcion: 'Productos electrónicos' };
      // En mysql2, create() retorna un objeto con insertId, no los datos completos
      const resultadoCreateMock = { insertId: 5, affectedRows: 1 };

      Categoria.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await crearCategoria(req, res);

      expect(Categoria.create).toHaveBeenCalledWith(bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'categorias',         // tabla
        5,                    // insertId
        'INSERT',             // acción
        'Se creó la categoría Electrónica'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: resultadoCreateMock });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { nombre: 'Ropa', descripcion: 'Prendas de vestir' };
      const resultadoCreateMock = { insertId: 6, affectedRows: 1 };

      Categoria.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearCategoria(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'categorias',
        6,
        'INSERT',
        'Se creó la categoría Ropa'
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe usar "N/A" si el nombre no viene en el body', async () => {
      const bodyMock = { descripcion: 'Sin nombre' };
      const resultadoCreateMock = { insertId: 7, affectedRows: 1 };

      Categoria.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 2 } };
      const res = mockRes();

      await crearCategoria(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        2,
        'categorias',
        7,
        'INSERT',
        'Se creó la categoría N/A'
      );
    });

    test('Debe usar 0 como insertId si no está disponible', async () => {
      const bodyMock = { nombre: 'Hogar' };
      const resultadoCreateMock = { affectedRows: 1 }; // Sin insertId

      Categoria.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 4 } };
      const res = mockRes();

      await crearCategoria(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        4,
        'categorias',
        0,                    // Fallback: 0
        'INSERT',
        'Se creó la categoría Hogar'
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el nombre ya existe (ER_DUP_ENTRY)', async () => {
      const bodyMock = { nombre: 'Existente' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Categoria.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre de la categoría ya existe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { nombre: 'Error' };
      const dbError = new Error('Error de conexión a la BD');

      Categoria.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});