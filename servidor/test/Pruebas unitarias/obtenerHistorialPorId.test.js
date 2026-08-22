// test/Pruebas unitarias/obtenerHistorialPorId.test.js

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
const { obtenerHistorialPorId } = require('../../controllers/historialController.js');

// Referencia al modelo simulado
const Historial = require('../../models/historialModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerHistorialPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el registro de historial si existe', async () => {
      const id = '5';
      const registroMock = { 
        id_historial: 5, 
        id_usuario: 10, 
        tabla: 'usuarios', 
        id_registro: 10,
        accion: 'INSERT', 
        descripcion: 'Se creó el usuario Juan',
        fecha: '2024-02-15T10:00:00Z' 
      };
      
      Historial.findById.mockResolvedValue(registroMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerHistorialPorId(req, res);

      expect(Historial.findById).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: registroMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el registro de historial no existe', async () => {
      const id = '999';
      
      Historial.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerHistorialPorId(req, res);

      expect(Historial.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Registro de historial no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Historial.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerHistorialPorId(req, res);

      expect(Historial.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});