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
}), { virtual: true });

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Importamos el controlador y prisma real
const { habilitarCategoria } = require('../../controllers/categoriasController.js');
const prisma = require('../../config/prisma.js').default || require('../../config/prisma.js');

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
  let updateProductosSpy;
  let updateServiciosSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mocks seguros para Prisma (ya que puede que no existan si no se generó el cliente)
    if (!prisma.productos) prisma.productos = {};
    if (!prisma.servicios) prisma.servicios = {};
    
    updateProductosSpy = jest.spyOn(prisma.productos, 'updateMany').mockResolvedValue({});
    updateServiciosSpy = jest.spyOn(prisma.servicios, 'updateMany').mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Habilitación exitosa', () => {
    test('Debe devolver 200 y ejecutar queries en cascada para reactivar dependencias', async () => {
      const id = '5';
      
      // Simulamos que Categoria.restore no lanza error
      Categoria.restore.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 3 } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      
      expect(updateProductosSpy).toHaveBeenCalledTimes(1);
      expect(updateProductosSpy).toHaveBeenCalledWith({
        where: { ID_CATEGORIA: 5 },
        data: { Estado: 'Activo' }
      });

      expect(updateServiciosSpy).toHaveBeenCalledTimes(1);
      expect(updateServiciosSpy).toHaveBeenCalledWith({
        where: { ID_CATEGORIA: 5 },
        data: { Estado: 'Activo' }
      });

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Categoría habilitada correctamente" });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la categoría no existe (Prisma lanza P2025)', async () => {
      const id = '999';
      
      // Simulamos que el modelo lanza P2025 al no encontrarlo
      const notFoundError = new Error('No encontrado');
      notFoundError.code = 'P2025';
      Categoria.restore.mockRejectedValue(notFoundError);

      const req = { params: { id } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Categoría no encontrada" });
      
      expect(updateProductosSpy).not.toHaveBeenCalled();
      expect(updateServiciosSpy).not.toHaveBeenCalled();
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
      
      expect(updateProductosSpy).not.toHaveBeenCalled();
      expect(updateServiciosSpy).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si fallan las queries en cascada de prisma', async () => {
      const id = '5';
      const dbError = new Error('Error al reactivar dependencias');

      Categoria.restore.mockResolvedValue();
      updateProductosSpy.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await habilitarCategoria(req, res);

      expect(Categoria.restore).toHaveBeenCalledWith(id);
      expect(updateProductosSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al reactivar dependencias'
      });
    });
  });
});