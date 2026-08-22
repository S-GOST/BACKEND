// test/Pruebas unitarias/eliminarInforme.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/informeModel.js', () => ({
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
const { eliminarInforme } = require('../../controllers/informeController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const Informe = require('../../models/informeModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarInforme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe devolver 200 y registrar la eliminación con req.user presente', async () => {
      const id = '5';
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Diagnóstico',
        trabajo_realizado: 'Trabajo',
        recomendaciones: 'Recomendaciones'
      };

      Informe.findById.mockResolvedValue(existeMock);
      Informe.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 3 } };
      const res = mockRes();

      await eliminarInforme(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(Informe.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        3,              // req.user.id_usuario
        'informe',      // tabla en singular
        id,
        'DELETE',
        'Eliminó el informe de la orden 100'
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Informe eliminado correctamente'
      });
    });

    test('Debe usar existe.id_tecnico en logHistory si req.user no está presente', async () => {
      const id = '6';
      const existeMock = {
        id_informe: 6,
        id_orden: '200',
        id_tecnico: '15',
        diagnostico: 'D',
        trabajo_realizado: 'T',
        recomendaciones: 'R'
      };

      Informe.findById.mockResolvedValue(existeMock);
      Informe.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarInforme(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(Informe.delete).toHaveBeenCalledWith(id);
      expect(logHistory).toHaveBeenCalledWith(
        '15',           // Fallback a existe.id_tecnico
        'informe',
        id,
        'DELETE',
        'Eliminó el informe de la orden 200'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Informe eliminado correctamente'
      });
    });

    test('Debe usar 1 como último fallback si ni req.user ni existe.id_tecnico están presentes', async () => {
      const id = '7';
      const existeMock = {
        id_informe: 7,
        id_orden: '300',
        // Sin id_tecnico
        diagnostico: 'D',
        trabajo_realizado: 'T',
        recomendaciones: 'R'
      };

      Informe.findById.mockResolvedValue(existeMock);
      Informe.delete.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarInforme(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,              // Último fallback: 1
        'informe',
        id,
        'DELETE',
        'Eliminó el informe de la orden 300'
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el informe no existe', async () => {
      const id = '999';

      Informe.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarInforme(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Informe no encontrado'
      });
      expect(Informe.delete).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la búsqueda inicial (findById)', async () => {
      const id = '5';
      const dbError = new Error('Error al buscar informe');

      Informe.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarInforme(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al buscar informe'
      });
      expect(Informe.delete).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la eliminación (delete)', async () => {
      const id = '5';
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10'
      };
      const dbError = new Error('Error al eliminar informe');

      Informe.findById.mockResolvedValue(existeMock);
      Informe.delete.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarInforme(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(Informe.delete).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar informe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});