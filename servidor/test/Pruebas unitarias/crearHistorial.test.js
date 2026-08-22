// test/Pruebas unitarias/crearHistorial.test.js

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
const { crearHistorial } = require('../../controllers/historialController.js');

// Referencia al modelo simulado
const Historial = require('../../models/historialModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearHistorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver 200 y el registro de historial creado', async () => {
      const bodyMock = {
        id_usuario: 10,
        tabla: 'usuarios',
        id_registro: 5,
        accion: 'INSERT',
        descripcion: 'Se creó el usuario Juan Pérez'
      };
      const nuevoRegistroMock = { 
        id_historial: 100, 
        ...bodyMock,
        fecha: '2024-02-15T10:00:00Z'
      };

      Historial.create.mockResolvedValue(nuevoRegistroMock);

      const req = { body: bodyMock };
      const res = mockRes();

      await crearHistorial(req, res);

      expect(Historial.create).toHaveBeenCalledWith(bodyMock);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: nuevoRegistroMock 
      });
    });

    test('Debe manejar correctamente cuando el modelo retorna solo insertId', async () => {
      const bodyMock = {
        id_usuario: 15,
        tabla: 'productos',
        accion: 'UPDATE'
      };
      // mysql2 create puede retornar { insertId, affectedRows }
      const resultadoCreateMock = { insertId: 101, affectedRows: 1 };

      Historial.create.mockResolvedValue(resultadoCreateMock);

      const req = { body: bodyMock };
      const res = mockRes();

      await crearHistorial(req, res);

      expect(Historial.create).toHaveBeenCalledWith(bodyMock);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: resultadoCreateMock 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = {
        id_usuario: 10,
        tabla: 'usuarios',
        accion: 'INSERT'
      };
      const dbError = new Error('Error de conexión a la BD');

      Historial.create.mockRejectedValue(dbError);

      const req = { body: bodyMock };
      const res = mockRes();

      await crearHistorial(req, res);

      expect(Historial.create).toHaveBeenCalledWith(bodyMock);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe devolver 500 si hay error de validación de base de datos', async () => {
      const bodyMock = {
        id_usuario: null, // Campo requerido nulo
        tabla: 'usuarios'
      };
      const validationError = new Error('Campo id_usuario no puede ser nulo');

      Historial.create.mockRejectedValue(validationError);

      const req = { body: bodyMock };
      const res = mockRes();

      await crearHistorial(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Campo id_usuario no puede ser nulo'
      });
    });
  });
});