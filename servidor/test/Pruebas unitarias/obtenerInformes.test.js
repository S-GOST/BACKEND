// test/Pruebas unitarias/obtenerInformes.test.js

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

// Mock de seguridad para db.js
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

const { obtenerInformes } = require('../../controllers/informeController.js');

// Referencia al modelo simulado (debe coincidir con el nombre del mock)
const Informe = require('../../models/informeModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerInformes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de informes', async () => {
      const informesMock = [
        { id_informe: 1, titulo: 'Reporte Mensual Enero', fecha: '2024-01-31' },
        { id_informe: 2, titulo: 'Reporte Mensual Febrero', fecha: '2024-02-28' },
      ];
      Informe.findAll.mockResolvedValue(informesMock);

      const req = {};
      const res = mockRes();

      await obtenerInformes(req, res);

      expect(Informe.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: informesMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay informes', async () => {
      Informe.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerInformes(req, res);

      expect(Informe.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Informe.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerInformes(req, res);

      expect(Informe.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});