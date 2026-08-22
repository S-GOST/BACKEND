// test/Pruebas unitarias/actualizarServicio.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/serviciosModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCategoria: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}));

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
const { actualizarServicio } = require('../../controllers/serviciosController.js');
const { logHistory } = require('../../utils/historyLogger.js');

// Referencia al modelo simulado
const Servicio = require('../../models/serviciosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('actualizarServicio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver 200 y registrar la actualización correctamente', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Mantenimiento Actualizado', precio: 75 };
      const resultadoUpdateMock = { affectedRows: 1 };

      Servicio.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await actualizarServicio(req, res);

      expect(Servicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'servicios',          // tabla
        id,                   // id del servicio (string)
        'UPDATE',             // acción
        `Se actualizó el servicio ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: resultadoUpdateMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '6';
      const bodyMock = { nombre: 'Servicio Actualizado', precio: 100 };
      const resultadoUpdateMock = { affectedRows: 1 };

      Servicio.update.mockResolvedValue(resultadoUpdateMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarServicio(req, res);

      expect(Servicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'servicios',
        id,
        'UPDATE',
        `Se actualizó el servicio ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: resultadoUpdateMock });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el nombre ya existe (ER_DUP_ENTRY)', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Existente' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Servicio.update.mockRejectedValue(duplicateError);

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarServicio(req, res);

      expect(Servicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre del servicio ya existe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const bodyMock = { nombre: 'Error' };
      const dbError = new Error('Error de conexión a la BD');

      Servicio.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarServicio(req, res);

      expect(Servicio.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});