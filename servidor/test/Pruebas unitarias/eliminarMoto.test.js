// test/Pruebas unitarias/eliminarMoto.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/motosModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    findByCliente: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

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
const { eliminarMoto } = require('../../controllers/motosController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const Moto = require('../../models/motosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarMoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe devolver 200 y confirmar la eliminación correctamente con req.user', async () => {
      const id = '5';

      Moto.delete.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(Moto.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'motos',
        id,
        'DELETE',
        `Se eliminó la moto ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Moto eliminada correctamente'
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '7';

      Moto.delete.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(Moto.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'motos',
        id,
        'DELETE',
        `Se eliminó la moto ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Moto eliminada correctamente'
      });
    });

    test('Debe responder éxito incluso si affectedRows es 0 (ID inexistente)', async () => {
      const id = '999';

      // Aunque el registro no exista, el controlador no valida affectedRows
      Moto.delete.mockResolvedValue({ affectedRows: 0 });
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(Moto.delete).toHaveBeenCalledWith(id);
      // El controlador responde éxito de todas formas (comportamiento actual)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Moto eliminada correctamente'
      });
    });
  });

  describe('Manejo de integridad referencial (ER_ROW_IS_REFERENCED_2)', () => {
    test('Debe devolver 400 si la moto tiene órdenes de servicio asociadas', async () => {
      const id = '5';
      const fkError = new Error('Cannot delete or update a parent row: a foreign key constraint fails');
      fkError.code = 'ER_ROW_IS_REFERENCED_2';

      Moto.delete.mockRejectedValue(fkError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(Moto.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No se puede eliminar la moto porque tiene órdenes de servicio asociadas. Debe ser inhabilitada.'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la eliminación en la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');

      Moto.delete.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(Moto.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla logHistory', async () => {
      const id = '5';
      const logError = new Error('Error al registrar historial');

      Moto.delete.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockRejectedValue(logError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al registrar historial'
      });
    });

    test('Debe capturar el error en console.error con el prefijo correcto', async () => {
      const id = '5';
      const dbError = new Error('Error específico al eliminar');
      const consoleSpy = jest.spyOn(console, 'error');

      Moto.delete.mockRejectedValue(dbError);

      const req = { params: { id }, user: { id_usuario: 10 } };
      const res = mockRes();

      await eliminarMoto(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error al eliminar moto:",
        dbError
      );
    });
  });
});