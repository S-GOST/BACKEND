// test/Pruebas unitarias/actualizarCategoria.test.js

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
const { actualizarCategoria } = require('../../controllers/categoriasController.js');
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

describe('actualizarCategoria', () => {
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
      const bodyMock = { nombre: 'Electrónica Actualizada', descripcion: 'Nueva descripción' };
      const resultadoUpdateMock = { affectedRows: 1 };

      Categoria.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await actualizarCategoria(req, res);

      expect(Categoria.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'categorias',         // tabla
        id,                   // id de la categoría (string)
        'UPDATE',             // acción
        `Se actualizó la categoría ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Categoría actualizada correctamente" });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';
      const bodyMock = { nombre: 'Ropa' };
      const resultadoUpdateMock = { affectedRows: 1 };

      Categoria.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarCategoria(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'categorias',
        id,
        'UPDATE',
        `Se actualizó la categoría ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Categoría actualizada correctamente" });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la categoría no existe (affectedRows === 0)', async () => {
      const id = '999';
      const bodyMock = { nombre: 'Inexistente' };
      const resultadoUpdateMock = { affectedRows: 0 };

      Categoria.update.mockResolvedValue(resultadoUpdateMock);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarCategoria(req, res);

      expect(Categoria.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Categoría no encontrada" });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el nombre ya existe (ER_DUP_ENTRY)', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Existente' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Categoria.update.mockRejectedValue(duplicateError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre de la categoría ya existe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Error' };
      const dbError = new Error('Error de conexión a la BD');

      Categoria.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});