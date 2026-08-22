// test/Pruebas unitarias/eliminarCategoria.test.js

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
    checkDependencies: jest.fn(), // 🔧 Añadido para esta función
  },
}));

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Mock de db.js con pool.query para las actualizaciones en cascada
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador, logger y pool simulados
const { eliminarCategoria } = require('../../controllers/categoriasController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');

// Referencia al modelo simulado
const Categoria = require('../../models/categoriasModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarCategoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe devolver 200 y eliminar correctamente cuando no hay dependencias y force=false', async () => {
      const id = '5';
      const depsMock = { productosCount: 0, serviciosCount: 0 };
      const resultadoDeleteMock = { affectedRows: 1 };

      Categoria.checkDependencies.mockResolvedValue(depsMock);
      Categoria.delete.mockResolvedValue(resultadoDeleteMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, query: {}, user: { id_usuario: 3 } };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(Categoria.checkDependencies).toHaveBeenCalledWith(id);
      expect(Categoria.delete).toHaveBeenCalledWith(id);
      expect(pool.query).not.toHaveBeenCalled();
      expect(logHistory).toHaveBeenCalledWith(
        3,
        'categorias',
        id,
        'UPDATE',
        `Se inhabilitó la categoría ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Categoría inhabilitada correctamente" });
    });

    test('Debe devolver 200 y ejecutar queries en cascada cuando force=true', async () => {
      const id = '5';
      const resultadoDeleteMock = { affectedRows: 1 };

      Categoria.delete.mockResolvedValue(resultadoDeleteMock);
      pool.query.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id }, query: { force: 'true' }, user: { id_usuario: 3 } };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(Categoria.checkDependencies).not.toHaveBeenCalled();
      expect(Categoria.delete).toHaveBeenCalledWith(id);
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenCalledWith("UPDATE productos SET Estado = 'Inactivo' WHERE ID_CATEGORIA = ?", [id]);
      expect(pool.query).toHaveBeenCalledWith("UPDATE servicios SET Estado = 'Inactivo' WHERE ID_CATEGORIA = ?", [id]);
      expect(logHistory).toHaveBeenCalledWith(
        3,
        'categorias',
        id,
        'UPDATE',
        `Se inhabilitó la categoría ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Categoría inhabilitada correctamente" });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';
      const depsMock = { productosCount: 0, serviciosCount: 0 };
      const resultadoDeleteMock = { affectedRows: 1 };

      Categoria.checkDependencies.mockResolvedValue(depsMock);
      Categoria.delete.mockResolvedValue(resultadoDeleteMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, query: {} }; // Sin req.user
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback: 1
        'categorias',
        id,
        'UPDATE',
        `Se inhabilitó la categoría ID ${id}`
      );
    });
  });

  describe('Conflictos de dependencias (409)', () => {
    test('Debe devolver 409 si hay productos asociados y force=false', async () => {
      const id = '5';
      const depsMock = { productosCount: 3, serviciosCount: 0 };

      Categoria.checkDependencies.mockResolvedValue(depsMock);

      const req = { params: { id }, query: {} };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La categoría tiene 3 producto(s) y 0 servicio(s) activos asociados. ¿Desea inhabilitarla junto con sus dependencias?',
        dependencies: depsMock
      });
      expect(Categoria.delete).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 409 si hay servicios asociados y force=false', async () => {
      const id = '5';
      const depsMock = { productosCount: 0, serviciosCount: 2 };

      Categoria.checkDependencies.mockResolvedValue(depsMock);

      const req = { params: { id }, query: {} };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La categoría tiene 0 producto(s) y 2 servicio(s) activos asociados. ¿Desea inhabilitarla junto con sus dependencias?',
        dependencies: depsMock
      });
    });

    test('Debe devolver 409 si hay productos y servicios asociados y force=false', async () => {
      const id = '5';
      const depsMock = { productosCount: 3, serviciosCount: 2 };

      Categoria.checkDependencies.mockResolvedValue(depsMock);

      const req = { params: { id }, query: {} };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La categoría tiene 3 producto(s) y 2 servicio(s) activos asociados. ¿Desea inhabilitarla junto con sus dependencias?',
        dependencies: depsMock
      });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la categoría no existe (affectedRows === 0)', async () => {
      const id = '999';
      const depsMock = { productosCount: 0, serviciosCount: 0 };
      const resultadoDeleteMock = { affectedRows: 0 };

      Categoria.checkDependencies.mockResolvedValue(depsMock);
      Categoria.delete.mockResolvedValue(resultadoDeleteMock);

      const req = { params: { id }, query: {} };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Categoría no encontrada" });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la validación de dependencias', async () => {
      const id = '5';
      const dbError = new Error('Error al verificar dependencias');

      Categoria.checkDependencies.mockRejectedValue(dbError);

      const req = { params: { id }, query: {} };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al verificar dependencias'
      });
      expect(Categoria.delete).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la eliminación', async () => {
      const id = '5';
      const depsMock = { productosCount: 0, serviciosCount: 0 };
      const dbError = new Error('Error al eliminar categoría');

      Categoria.checkDependencies.mockResolvedValue(depsMock);
      Categoria.delete.mockRejectedValue(dbError);

      const req = { params: { id }, query: {} };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar categoría'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si fallan las queries en cascada (force=true)', async () => {
      const id = '5';
      const resultadoDeleteMock = { affectedRows: 1 };
      const dbError = new Error('Error al actualizar dependencias');

      Categoria.delete.mockResolvedValue(resultadoDeleteMock);
      pool.query.mockRejectedValue(dbError);

      const req = { params: { id }, query: { force: 'true' } };
      const res = mockRes();

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al actualizar dependencias'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});