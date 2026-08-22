// test/Pruebas unitarias/obtenerCategoriaPorId.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/categoriasModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock de seguridad para db.js
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Ahora sí importamos el controlador
const { obtenerCategoriaPorId } = require('../../controllers/categoriasController.js');

// Referencia al modelo simulado
const Categoria = require('../../models/categoriasModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerCategoriaPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la categoría si existe', async () => {
      const id = '5';
      const categoriaMock = { id_categoria: 5, nombre: 'Electrónica', descripcion: 'Productos electrónicos' };
      
      Categoria.findById.mockResolvedValue(categoriaMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerCategoriaPorId(req, res);

      expect(Categoria.findById).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: categoriaMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la categoría no existe', async () => {
      const id = '999';
      
      Categoria.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerCategoriaPorId(req, res);

      expect(Categoria.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Categoría no encontrada'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Categoria.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerCategoriaPorId(req, res);

      expect(Categoria.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});