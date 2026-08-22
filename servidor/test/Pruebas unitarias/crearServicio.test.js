// test/Pruebas unitarias/crearServicio.test.js

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
const { crearServicio } = require('../../controllers/serviciosController.js');
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

describe('crearServicio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver 200 y registrar el servicio creado', async () => {
      const bodyMock = { nombre: 'Mantenimiento Preventivo', precio: 50, id_categoria: 1 };
      const nuevoServicioMock = { insertId: 5, affectedRows: 1 };

      Servicio.create.mockResolvedValue(nuevoServicioMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await crearServicio(req, res);

      expect(Servicio.create).toHaveBeenCalledWith(bodyMock);
      expect(logHistory).toHaveBeenCalledWith(
        3,                    // req.user.id_usuario
        'servicios',          // tabla
        5,                    // insertId
        'INSERT',             // acción
        'Se creó el servicio Mantenimiento Preventivo'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: nuevoServicioMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { nombre: 'Instalación de Red', precio: 120 };
      const nuevoServicioMock = { insertId: 6, affectedRows: 1 };

      Servicio.create.mockResolvedValue(nuevoServicioMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearServicio(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,                    // Fallback: 1
        'servicios',
        6,
        'INSERT',
        'Se creó el servicio Instalación de Red'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: nuevoServicioMock });
    });

    test('Debe usar "N/A" si el nombre no viene en el body', async () => {
      const bodyMock = { precio: 100 };
      const nuevoServicioMock = { insertId: 7, affectedRows: 1 };

      Servicio.create.mockResolvedValue(nuevoServicioMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 2 } };
      const res = mockRes();

      await crearServicio(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        2,
        'servicios',
        7,
        'INSERT',
        'Se creó el servicio N/A'
      );
    });

    test('Debe usar 0 como insertId si no está disponible', async () => {
      const bodyMock = { nombre: 'Reparación' };
      const nuevoServicioMock = { affectedRows: 1 }; // Sin insertId

      Servicio.create.mockResolvedValue(nuevoServicioMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 4 } };
      const res = mockRes();

      await crearServicio(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        4,
        'servicios',
        0,                    // Fallback: 0
        'INSERT',
        'Se creó el servicio Reparación'
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el nombre ya existe (ER_DUP_ENTRY)', async () => {
      const bodyMock = { nombre: 'Existente' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Servicio.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre del servicio ya existe'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { nombre: 'Error' };
      const dbError = new Error('Error de conexión a la BD');

      Servicio.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});