// test/Pruebas unitarias/eliminarHistorial.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/historialModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { eliminarHistorial } = require('../../controllers/historialController.js');

// Referencia al modelo simulado
const Historial = require('../../models/historialModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarHistorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe devolver 200 y confirmar la eliminación correctamente', async () => {
      const id = '5';

      Historial.delete.mockResolvedValue({ affectedRows: 1 });

      const req = { params: { id } };
      const res = mockRes();

      await eliminarHistorial(req, res);

      expect(Historial.delete).toHaveBeenCalledWith(id);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registro de historial eliminado correctamente'
      });
    });

    test('Debe ejecutarse sin error incluso si affectedRows es 0 (ID inexistente)', async () => {
      const id = '999';

      // Aunque el registro no exista, el controlador no valida affectedRows
      Historial.delete.mockResolvedValue({ affectedRows: 0 });

      const req = { params: { id } };
      const res = mockRes();

      await eliminarHistorial(req, res);

      expect(Historial.delete).toHaveBeenCalledWith(id);
      // El controlador responde éxito de todas formas (comportamiento actual)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registro de historial eliminado correctamente'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la eliminación en la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');

      Historial.delete.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarHistorial(req, res);

      expect(Historial.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe capturar el error en console.error con el mensaje correcto', async () => {
      const id = '5';
      const dbError = new Error('Error específico al eliminar');
      const consoleSpy = jest.spyOn(console, 'error');

      Historial.delete.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarHistorial(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error al eliminar historial:",
        dbError
      );
    });

    test('Debe devolver 500 si hay error de integridad referencial', async () => {
      const id = '5';
      const fkError = new Error('Cannot delete or update a parent row: a foreign key constraint fails');

      Historial.delete.mockRejectedValue(fkError);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarHistorial(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete or update a parent row: a foreign key constraint fails'
      });
    });
  });
});