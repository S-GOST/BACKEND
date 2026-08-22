// test/Pruebas unitarias/crearInforme.test.js

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
const { crearInforme } = require('../../controllers/informeController.js');
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

describe('crearInforme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver 201, el informe completo y registrar el historial', async () => {
      const bodyMock = {
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Equipo con falla en fuente',
        trabajo_realizado: 'Reemplazo de fuente',
        recomendaciones: 'Revisar en 6 meses'
      };
      
      // mysql2 create retorna { insertId, affectedRows }
      const resultadoCreateMock = { insertId: 25, affectedRows: 1 };
      const nuevoInformeMock = { 
        id_informe: 25, 
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Equipo con falla en fuente',
        trabajo_realizado: 'Reemplazo de fuente',
        recomendaciones: 'Revisar en 6 meses'
      };

      Informe.create.mockResolvedValue(resultadoCreateMock);
      Informe.findById.mockResolvedValue(nuevoInformeMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock };
      const res = mockRes();

      await crearInforme(req, res);

      expect(Informe.create).toHaveBeenCalledWith({
        id_orden: '100',
        id_tecnico: '10',
        diagnostico: 'Equipo con falla en fuente',
        trabajo_realizado: 'Reemplazo de fuente',
        recomendaciones: 'Revisar en 6 meses'
      });
      expect(Informe.findById).toHaveBeenCalledWith(25);
      expect(logHistory).toHaveBeenCalledWith(
        '10',           // id_tecnico directamente (no req.user)
        'informe',      // tabla en singular
        25,             // nuevoId
        'INSERT',
        'Redactó un informe para la orden 100'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: nuevoInformeMock,
        insertResult: resultadoCreateMock
      });
    });
  });

  describe('Validación de campos obligatorios (400)', () => {
    test('Debe devolver 400 si falta id_orden', async () => {
      const bodyMock = { 
        id_tecnico: '10', 
        diagnostico: 'Diagnóstico' 
      };

      const req = { body: bodyMock };
      const res = mockRes();

      await crearInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Faltan campos obligatorios: id_orden, id_tecnico'
      });
      expect(Informe.create).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 400 si falta id_tecnico', async () => {
      const bodyMock = { 
        id_orden: '100', 
        diagnostico: 'Diagnóstico' 
      };

      const req = { body: bodyMock };
      const res = mockRes();

      await crearInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Faltan campos obligatorios: id_orden, id_tecnico'
      });
      expect(Informe.create).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 400 si faltan ambos campos obligatorios', async () => {
      const bodyMock = { diagnostico: 'Solo diagnóstico' };

      const req = { body: bodyMock };
      const res = mockRes();

      await crearInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Faltan campos obligatorios: id_orden, id_tecnico'
      });
      expect(Informe.create).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la creación del informe', async () => {
      const bodyMock = { 
        id_orden: '100', 
        id_tecnico: '10',
        diagnostico: 'Test' 
      };
      const dbError = new Error('Error al insertar en BD');

      Informe.create.mockRejectedValue(dbError);

      const req = { body: bodyMock };
      const res = mockRes();

      await crearInforme(req, res);

      expect(Informe.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al insertar en BD'
      });
      expect(Informe.findById).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la búsqueda del informe recién creado', async () => {
      const bodyMock = { 
        id_orden: '100', 
        id_tecnico: '10',
        diagnostico: 'Test' 
      };
      const resultadoCreateMock = { insertId: 25, affectedRows: 1 };
      const dbError = new Error('Error al recuperar el informe');

      Informe.create.mockResolvedValue(resultadoCreateMock);
      Informe.findById.mockRejectedValue(dbError);

      const req = { body: bodyMock };
      const res = mockRes();

      await crearInforme(req, res);

      expect(Informe.create).toHaveBeenCalled();
      expect(Informe.findById).toHaveBeenCalledWith(25);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al recuperar el informe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});