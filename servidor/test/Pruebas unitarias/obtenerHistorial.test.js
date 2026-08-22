// test/Pruebas unitarias/obtenerHistorial.test.js

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
const { obtenerHistorial } = require('../../controllers/historialController.js');

// Referencia al modelo simulado
const Historial = require('../../models/historialModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerHistorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de historial', async () => {
      const historialMock = [
        { id_historial: 1, id_usuario: 10, tabla: 'usuarios', accion: 'INSERT', fecha: '2024-02-15' },
        { id_historial: 2, id_usuario: 15, tabla: 'productos', accion: 'UPDATE', fecha: '2024-02-16' },
      ];
      Historial.findAll.mockResolvedValue(historialMock);

      const req = {};
      const res = mockRes();

      await obtenerHistorial(req, res);

      expect(Historial.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: historialMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay registros de historial', async () => {
      Historial.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerHistorial(req, res);

      expect(Historial.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Historial.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerHistorial(req, res);

      expect(Historial.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});