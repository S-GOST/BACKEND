// test/Pruebas unitarias/obtenerCategoriasPorTipo.test.js

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

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerCategoriasPorTipo } = require('../../controllers/categoriasController.js');

// Referencia al modelo simulado
const Categoria = require('../../models/categoriasModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerCategoriasPorTipo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y las categorías filtradas por tipo', async () => {
      const tipo = 'electronica';
      const categoriasMock = [
        { id_categoria: 1, nombre: 'Celulares', tipo: 'electronica' },
        { id_categoria: 2, nombre: 'Laptops', tipo: 'electronica' },
      ];
      
      Categoria.findByTipo.mockResolvedValue(categoriasMock);

      const req = { params: { tipo } };
      const res = mockRes();

      await obtenerCategoriasPorTipo(req, res);

      expect(Categoria.findByTipo).toHaveBeenCalledWith(tipo);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: categoriasMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y un arreglo vacío si no hay categorías de ese tipo', async () => {
      const tipo = 'inexistente';
      
      Categoria.findByTipo.mockResolvedValue([]);

      const req = { params: { tipo } };
      const res = mockRes();

      await obtenerCategoriasPorTipo(req, res);

      expect(Categoria.findByTipo).toHaveBeenCalledWith(tipo);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const tipo = 'electronica';
      const dbError = new Error('Error de conexión a la BD');
      
      Categoria.findByTipo.mockRejectedValue(dbError);

      const req = { params: { tipo } };
      const res = mockRes();

      await obtenerCategoriasPorTipo(req, res);

      expect(Categoria.findByTipo).toHaveBeenCalledWith(tipo);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});