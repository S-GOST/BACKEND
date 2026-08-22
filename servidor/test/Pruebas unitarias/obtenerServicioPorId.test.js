// test/Pruebas unitarias/obtenerServicioPorId.test.js

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

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerServicioPorId } = require('../../controllers/serviciosController.js');

// Referencia al modelo simulado
const Servicio = require('../../models/serviciosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerServicioPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el servicio si existe', async () => {
      const id = '5';
      const servicioMock = { id_servicio: 5, nombre: 'Mantenimiento Preventivo', precio: 50 };
      
      Servicio.findByPk.mockResolvedValue(servicioMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerServicioPorId(req, res);

      expect(Servicio.findByPk).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: servicioMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el servicio no existe', async () => {
      const id = '999';
      
      Servicio.findByPk.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerServicioPorId(req, res);

      expect(Servicio.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Servicio no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Servicio.findByPk.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerServicioPorId(req, res);

      expect(Servicio.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});