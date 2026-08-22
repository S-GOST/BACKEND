// test/Pruebas unitarias/obtenerTipoDocumentoPorId.test.js

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
const { obtenerTipoDocumentoPorId } = require('../../controllers/tipoDocumentoController.js');

// Referencia al modelo simulado
const TipoDocumento = require('../../models/tipoDocumentoModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerTipoDocumentoPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y el tipo de documento si existe', async () => {
      const id = '5';
      const tipoMock = { 
        ID_TIPO_DOCUMENTO: 5, 
        Nombre: 'Cédula de Ciudadanía' 
      };
      
      TipoDocumento.findById.mockResolvedValue(tipoMock);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerTipoDocumentoPorId(req, res);

      expect(TipoDocumento.findById).toHaveBeenCalledWith(id);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tipoMock });
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el tipo de documento no existe (null)', async () => {
      const id = '999';
      
      TipoDocumento.findById.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerTipoDocumentoPorId(req, res);

      expect(TipoDocumento.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    });

    test('Debe devolver 404 si el tipo de documento no existe (undefined)', async () => {
      const id = '888';
      
      TipoDocumento.findById.mockResolvedValue(undefined);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerTipoDocumentoPorId(req, res);

      expect(TipoDocumento.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '5';
      const dbError = new Error('Error de conexión a la BD');
      
      TipoDocumento.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerTipoDocumentoPorId(req, res);

      expect(TipoDocumento.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });

    test('Debe manejar correctamente el mensaje del error recibido', async () => {
      const id = '5';
      const dbError = new Error('Timeout exceeded');
      
      TipoDocumento.findById.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await obtenerTipoDocumentoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Timeout exceeded'
      });
    });
  });
});