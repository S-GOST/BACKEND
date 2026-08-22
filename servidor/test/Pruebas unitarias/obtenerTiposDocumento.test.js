// test/Pruebas unitarias/obtenerTiposDocumento.test.js

// 1. Mocks (Jest los eleva al inicio automáticamente)
jest.mock('../../models/tipoDocumentoModel.js', () => ({
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
const { obtenerTiposDocumento } = require('../../controllers/tipoDocumentoController.js');

// Referencia al modelo simulado
const TipoDocumento = require('../../models/tipoDocumentoModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerTiposDocumento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de tipos de documento', async () => {
      const tiposMock = [
        { ID_TIPO_DOCUMENTO: 1, Nombre: 'Cédula de Ciudadanía' },
        { ID_TIPO_DOCUMENTO: 2, Nombre: 'Tarjeta de Identidad' },
        { ID_TIPO_DOCUMENTO: 3, Nombre: 'Cédula de Extranjería' },
      ];
      TipoDocumento.findAll.mockResolvedValue(tiposMock);

      const req = {};
      const res = mockRes();

      await obtenerTiposDocumento(req, res);

      expect(TipoDocumento.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tiposMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay tipos de documento', async () => {
      TipoDocumento.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerTiposDocumento(req, res);

      expect(TipoDocumento.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      TipoDocumento.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerTiposDocumento(req, res);

      expect(TipoDocumento.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });

    test('Debe manejar correctamente el mensaje del error recibido', async () => {
      const dbError = new Error('Timeout exceeded');
      TipoDocumento.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerTiposDocumento(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Timeout exceeded',
      });
    });
  });
});