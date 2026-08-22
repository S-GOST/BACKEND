// test/Pruebas unitarias/actualizarInforme.test.js

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
const { actualizarInforme } = require('../../controllers/informeController.js');
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

describe('actualizarInforme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver 200, el informe actualizado y registrar el historial (todos los campos nuevos)', async () => {
      const id = '5';
      const bodyMock = {
        id_orden: '200',
        id_tecnico: '15',
        diagnostico: 'Nuevo diagnóstico',
        trabajo_realizado: 'Nuevo trabajo',
        recomendaciones: 'Nuevas recomendaciones'
      };
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Diagnóstico anterior',
        trabajo_realizado: 'Trabajo anterior',
        recomendaciones: 'Recomendaciones anteriores'
      };
      const informeActualizadoMock = {
        id_informe: 5,
        id_orden: '200',
        id_tecnico: '15',
        diagnostico: 'Nuevo diagnóstico',
        trabajo_realizado: 'Nuevo trabajo',
        recomendaciones: 'Nuevas recomendaciones'
      };
      const resultadoUpdateMock = { affectedRows: 1 };

      Informe.findById
        .mockResolvedValueOnce(existeMock)
        .mockResolvedValueOnce(informeActualizadoMock);
      Informe.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(Informe.findById).toHaveBeenNthCalledWith(1, id);
      expect(Informe.update).toHaveBeenCalledWith(id, {
        id_orden: '200',
        id_tecnico: '15',
        diagnostico: 'Nuevo diagnóstico',
        trabajo_realizado: 'Nuevo trabajo',
        recomendaciones: 'Nuevas recomendaciones'
      });
      expect(Informe.findById).toHaveBeenNthCalledWith(2, id);
      expect(logHistory).toHaveBeenCalledWith(
        3,
        'informe',
        id,
        'UPDATE',
        'Actualizó el informe de la orden 200'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: informeActualizadoMock,
        updateResult: resultadoUpdateMock
      });
    });

    test('Debe usar los valores existentes cuando algunos campos faltan en el body', async () => {
      const id = '5';
      const bodyMock = { diagnostico: 'Solo diagnóstico nuevo' };
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Diagnóstico anterior',
        trabajo_realizado: 'Trabajo anterior',
        recomendaciones: 'Recomendaciones anteriores'
      };
      const informeActualizadoMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Solo diagnóstico nuevo',
        trabajo_realizado: 'Trabajo anterior',
        recomendaciones: 'Recomendaciones anteriores'
      };
      const resultadoUpdateMock = { affectedRows: 1 };

      Informe.findById
        .mockResolvedValueOnce(existeMock)
        .mockResolvedValueOnce(informeActualizadoMock);
      Informe.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(Informe.update).toHaveBeenCalledWith(id, {
        id_orden: '100',              // cayó al valor existente
        id_tecnico: '10',             // cayó al valor existente
        diagnostico: 'Solo diagnóstico nuevo', // nuevo valor
        trabajo_realizado: 'Trabajo anterior', // cayó al valor existente
        recomendaciones: 'Recomendaciones anteriores' // cayó al valor existente
      });
    });

    test('Debe usar existe.id_tecnico en logHistory si req.user no está presente', async () => {
      const id = '5';
      const bodyMock = { diagnostico: 'Test' };
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'D',
        trabajo_realizado: 'T',
        recomendaciones: 'R'
      };
      const informeActualizadoMock = { ...existeMock, diagnostico: 'Test' };
      const resultadoUpdateMock = { affectedRows: 1 };

      Informe.findById
        .mockResolvedValueOnce(existeMock)
        .mockResolvedValueOnce(informeActualizadoMock);
      Informe.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        '10',   // Fallback a existe.id_tecnico
        'informe',
        id,
        'UPDATE',
        'Actualizó el informe de la orden 100'
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el informe no existe (primera búsqueda)', async () => {
      const id = '999';
      const bodyMock = { diagnostico: 'Test' };

      Informe.findById.mockResolvedValueOnce(null);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Informe no encontrado'
      });
      expect(Informe.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la primera búsqueda (findById inicial)', async () => {
      const id = '5';
      const bodyMock = { diagnostico: 'Test' };
      const dbError = new Error('Error al buscar informe');

      Informe.findById.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al buscar informe'
      });
      expect(Informe.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la actualización', async () => {
      const id = '5';
      const bodyMock = { diagnostico: 'Test' };
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'D',
        trabajo_realizado: 'T',
        recomendaciones: 'R'
      };
      const dbError = new Error('Error al actualizar');

      Informe.findById.mockResolvedValueOnce(existeMock);
      Informe.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al actualizar'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la segunda búsqueda (findById después del update)', async () => {
      const id = '5';
      const bodyMock = { diagnostico: 'Test' };
      const existeMock = {
        id_informe: 5,
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'D',
        trabajo_realizado: 'T',
        recomendaciones: 'R'
      };
      const resultadoUpdateMock = { affectedRows: 1 };
      const dbError = new Error('Error al recuperar el informe actualizado');

      Informe.findById
        .mockResolvedValueOnce(existeMock)
        .mockRejectedValueOnce(dbError);
      Informe.update.mockResolvedValue(resultadoUpdateMock);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al recuperar el informe actualizado'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});