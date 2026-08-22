// test/Pruebas unitarias/obtenerMiHistorial.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/historialModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUsuarioId: jest.fn(), // 🔧 Añadido específicamente para esta función
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
const { obtenerMiHistorial } = require('../../controllers/historialController.js');

// Referencia al modelo simulado
const Historial = require('../../models/historialModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerMiHistorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de autenticación (401)', () => {
    test('Debe devolver 401 si req.user no está presente', async () => {
      const req = {}; // Sin req.user
      const res = mockRes();

      await obtenerMiHistorial(req, res);

      expect(Historial.findByUsuarioId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado'
      });
    });

    test('Debe devolver 401 si req.user existe pero no tiene id_usuario', async () => {
      const req = { user: {} }; // req.user existe, pero id_usuario es undefined
      const res = mockRes();

      await obtenerMiHistorial(req, res);

      expect(Historial.findByUsuarioId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado'
      });
    });
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el historial del usuario autenticado', async () => {
      const idUsuario = 10;
      const historialMock = [
        { id_historial: 1, id_usuario: 10, tabla: 'usuarios', accion: 'INSERT', fecha: '2024-02-15' },
        { id_historial: 2, id_usuario: 10, tabla: 'productos', accion: 'UPDATE', fecha: '2024-02-16' },
      ];
      
      Historial.findByUsuarioId.mockResolvedValue(historialMock);

      const req = { user: { id_usuario: idUsuario } };
      const res = mockRes();

      await obtenerMiHistorial(req, res);

      expect(Historial.findByUsuarioId).toHaveBeenCalledWith(idUsuario);
      expect(res.status).not.toHaveBeenCalled(); // Devuelve 200 implícito
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: historialMock 
      });
    });

    test('Debe devolver 200 y un arreglo vacío si el usuario no tiene registros', async () => {
      const idUsuario = 99;
      
      Historial.findByUsuarioId.mockResolvedValue([]);

      const req = { user: { id_usuario: idUsuario } };
      const res = mockRes();

      await obtenerMiHistorial(req, res);

      expect(Historial.findByUsuarioId).toHaveBeenCalledWith(idUsuario);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: [] 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const idUsuario = 10;
      const dbError = new Error('Error de conexión a la BD');
      
      Historial.findByUsuarioId.mockRejectedValue(dbError);

      const req = { user: { id_usuario: idUsuario } };
      const res = mockRes();

      await obtenerMiHistorial(req, res);

      expect(Historial.findByUsuarioId).toHaveBeenCalledWith(idUsuario);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});