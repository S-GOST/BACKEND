// test/Pruebas unitarias/habilitarCategoria.test.js

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
    checkDependencies: jest.fn(),
    restore: jest.fn(), 
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

// Importamos el controlador y pool simulados
const { habilitarCategoria } = require('../../controllers/categoriasController.js');
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

describe('habilitarCategoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Habilitación exitosa', () => {
    test('Debe devolver 200 y ejecutar queries en cascada para reactivar dependencias', async () => {
      const id = '5';
      const resultadoRestoreMock = { affectedRows: 1 };

      Categoria.restore.mockResolvedValue(resultadoRestoreMock);
      pool.query.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 3 } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenCalledWith("UPDATE productos SET Estado = 'Activo' WHERE ID_CATEGORIA = ?", [id]);
      expect(pool.query).toHaveBeenCalledWith("UPDATE servicios SET Estado = 'Activo' WHERE ID_CATEGORIA = ?", [id]);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Categoría habilitada correctamente" });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la categoría no existe (affectedRows === 0)', async () => {
      const id = '999';
      const resultadoRestoreMock = { affectedRows: 0 };

      Categoria.restore.mockResolvedValue(resultadoRestoreMock);

      const req = { params: { id } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Categoría no encontrada" });
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la restauración de la categoría', async () => {
      const id = '5';
      const dbError = new Error('Error al restaurar categoría');

      Categoria.restore.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al restaurar categoría'
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si fallan las queries en cascada', async () => {
      const id = '5';
      const resultadoRestoreMock = { affectedRows: 1 };
      const dbError = new Error('Error al reactivar dependencias');

      Categoria.restore.mockResolvedValue(resultadoRestoreMock);
      pool.query.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      expect(pool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al reactivar dependencias'
      });
    });
  });
});