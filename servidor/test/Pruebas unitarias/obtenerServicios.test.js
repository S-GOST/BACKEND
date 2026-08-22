// test/Pruebas unitarias/obtenerServicios.test.js

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
const { obtenerServicios } = require('../../controllers/serviciosController.js');

// Referencia al modelo simulado
const Servicio = require('../../models/serviciosModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerServicios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de servicios', async () => {
      const serviciosMock = [
        { id_servicio: 1, nombre: 'Mantenimiento Preventivo', precio: 50 },
        { id_servicio: 2, nombre: 'Instalación de Red', precio: 120 },
      ];
      Servicio.findAll.mockResolvedValue(serviciosMock);

      const req = {};
      const res = mockRes();

      await obtenerServicios(req, res);

      expect(Servicio.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: serviciosMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay servicios', async () => {
      Servicio.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerServicios(req, res);

      expect(Servicio.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Servicio.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerServicios(req, res);

      expect(Servicio.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});