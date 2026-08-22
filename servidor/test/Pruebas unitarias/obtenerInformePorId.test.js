// test/Pruebas unitarias/obtenerInformePorId.test.js

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
}), { virtual: true }); // Evita errores de ruta

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

// Importamos el controlador
const { obtenerInformePorId } = require('../../controllers/informeController.js');

// Referencia al modelo simulado
const Informe = require('../../models/informeModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerInformePorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el informe si existe', async () => {
      const id = '5';
      const informeMock = { 
        id_informe: 5, 
        id_tecnico: 10, 
        titulo: 'Mantenimiento Preventivo',
        fecha: '2024-02-15' 
      };
      
      Informe.findById.mockResolvedValue(informeMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerInformePorId(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: informeMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el informe no existe', async () => {
      const id = '999';
      
      Informe.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerInformePorId(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Informe no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      Informe.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerInformePorId(req, res);

      expect(Informe.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});