// test/Pruebas unitarias/obtenerCategorias.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/categoriasModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Ahora sí importamos el controlador
const { obtenerCategorias } = require('../../controllers/categoriasController.js');

// Referencia al modelo simulado (con 's')
const Categoria = require('../../models/categoriasModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerCategorias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de categorías', async () => {
      const categoriasMock = [
        { id_categoria: 1, nombre: 'lubricantes y refrigerantes' },
        { id_categoria: 2, nombre: 'Accesorios' },
      ];
      Categoria.findAll.mockResolvedValue(categoriasMock);

      const req = {};
      const res = mockRes();

      await obtenerCategorias(req, res);

      expect(Categoria.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: categoriasMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay categorías', async () => {
      Categoria.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerCategorias(req, res);

      expect(Categoria.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Categoria.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerCategorias(req, res);

      expect(Categoria.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});