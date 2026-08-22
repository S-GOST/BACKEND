// test/Pruebas unitarias/actualizarHistorial.test.js

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
const { actualizarHistorial } = require('../../controllers/historialController.js');

// Referencia al modelo simulado
const Historial = require('../../models/historialModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('actualizarHistorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver 200 y el registro de historial actualizado', async () => {
      const id = '5';
      const bodyMock = {
        id_usuario: 10,
        tabla: 'usuarios',
        id_registro: 5,
        accion: 'UPDATE',
        descripcion: 'Se actualizó el usuario Juan Pérez'
      };
      const registroActualizadoMock = { 
        affectedRows: 1,
        info: 'Rows matched: 1  Changed: 1  Warnings: 0'
      };

      Historial.update.mockResolvedValue(registroActualizadoMock);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarHistorial(req, res);

      expect(Historial.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: registroActualizadoMock 
      });
    });

    test('Debe manejar correctamente cuando el body tiene solo algunos campos', async () => {
      const id = '10';
      const bodyMock = {
        descripcion: 'Solo se actualiza la descripción'
      };
      const registroActualizadoMock = { 
        affectedRows: 1
      };

      Historial.update.mockResolvedValue(registroActualizadoMock);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarHistorial(req, res);

      expect(Historial.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: registroActualizadoMock 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la actualización en la base de datos', async () => {
      const id = '5';
      const bodyMock = {
        descripcion: 'Test de error'
      };
      const dbError = new Error('Error de conexión a la BD');

      Historial.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarHistorial(req, res);

      expect(Historial.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe devolver 500 si hay error de validación de base de datos', async () => {
      const id = '5';
      const bodyMock = {
        id_usuario: 'valor_invalido'
      };
      const validationError = new Error('Tipo de dato inválido para id_usuario');

      Historial.update.mockRejectedValue(validationError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarHistorial(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Tipo de dato inválido para id_usuario'
      });
    });

    test('Debe capturar el error en console.error', async () => {
      const id = '5';
      const bodyMock = { descripcion: 'Test' };
      const dbError = new Error('Error específico de BD');
      const consoleSpy = jest.spyOn(console, 'error');

      Historial.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarHistorial(req, res);

      expect(consoleSpy).toHaveBeenCalledWith("Error al actualizar historial:", dbError);
    });
  });
});