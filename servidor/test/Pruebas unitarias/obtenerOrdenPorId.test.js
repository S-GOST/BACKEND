// test/Pruebas unitarias/obtenerOrdenPorId.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/ordenServicioModel.js', () => ({
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
const { obtenerOrdenPorId } = require('../../controllers/ordenServicioController.js');

// Referencia al modelo simulado
const OrdenServicio = require('../../models/ordenServicioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerOrdenPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la orden si existe', async () => {
      const id = '5';
      const ordenMock = { 
        ID_ORDEN_SERVICIO: 5, 
        ID_CLIENTE: 10,
        fecha_ingreso: '2024-02-15',
        estado: 'Pendiente',
        observaciones: 'Equipo no enciende'
      };
      
      OrdenServicio.findById.mockResolvedValue(ordenMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerOrdenPorId(req, res);

      expect(OrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: ordenMock });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la orden no existe', async () => {
      const id = '999';
      
      OrdenServicio.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerOrdenPorId(req, res);

      expect(OrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Orden de servicio no encontrada'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      OrdenServicio.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerOrdenPorId(req, res);

      expect(OrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});