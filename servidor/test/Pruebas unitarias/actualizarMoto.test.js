// test/Pruebas unitarias/actualizarMoto.test.js

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
const { actualizarMoto } = require('../../controllers/motosController.js');
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

describe('actualizarMoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver 200 y la moto actualizada correctamente', async () => {
      const id = '5';
      const bodyMock = { 
        placa: 'ABC-123', 
        marca: 'Yamaha', 
        modelo: 'FZ',
        cilindraje: 150,
        kilometraje: 6000
      };
      const motoActualizadaMock = { affectedRows: 1 };

      Moto.update.mockResolvedValue(motoActualizadaMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 10 } 
      };
      const res = mockRes();

      await actualizarMoto(req, res);

      expect(Moto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'motos',
        id,
        'UPDATE',
        `Se actualizó la moto ID ${id}`
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: motoActualizadaMock 
      });
    });

    test('Debe actualizar solo algunos campos si el body es parcial', async () => {
      const id = '7';
      const bodyMock = { kilometraje: 15000 }; // Solo un campo
      const motoActualizadaMock = { affectedRows: 1 };

      Moto.update.mockResolvedValue(motoActualizadaMock);
      logHistory.mockResolvedValue();

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 5 } 
      };
      const res = mockRes();

      await actualizarMoto(req, res);

      expect(Moto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: motoActualizadaMock 
      });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '10';
      const bodyMock = { placa: 'XYZ-789', marca: 'Honda' };
      const motoActualizadaMock = { affectedRows: 1 };

      Moto.update.mockResolvedValue(motoActualizadaMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarMoto(req, res);

      expect(Moto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'motos',
        id,
        'UPDATE',
        `Se actualizó la moto ID ${id}`
      );
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: motoActualizadaMock 
      });
    });
  });

  describe('Manejo de duplicados (ER_DUP_ENTRY)', () => {
    test('Debe devolver 400 si la placa ya está registrada por otra moto', async () => {
      const id = '5';
      const bodyMock = { placa: 'ABC-123' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Moto.update.mockRejectedValue(duplicateError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarMoto(req, res);

      expect(Moto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La placa de la moto ya se encuentra registrada por otra moto'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la actualización en la base de datos', async () => {
      const id = '5';
      const bodyMock = { placa: 'DEF-456' };
      const dbError = new Error('Error de conexión a la BD');

      Moto.update.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarMoto(req, res);

      expect(Moto.update).toHaveBeenCalledWith(id, bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe capturar el error en console.error con el prefijo correcto', async () => {
      const id = '5';
      const bodyMock = { placa: 'GHI-789' };
      const dbError = new Error('Error específico');
      const consoleSpy = jest.spyOn(console, 'error');

      Moto.update.mockRejectedValue(dbError);

      const req = { 
        params: { id }, 
        body: bodyMock, 
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await actualizarMoto(req, res);

      expect(consoleSpy).toHaveBeenCalledWith("Error al actualizar moto:", dbError);
    });
  });
});