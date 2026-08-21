// test/obtenerTecnicos.test.js

const { obtenerTec } = require('@controllers/tecnicoController.js');

// 1. Mocks (se elevan automáticamente al inicio en CJS)
jest.mock('@models/usuarioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOneWithPassword: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Referencia al modelo simulado
const Usuario = require('@models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerTec', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y la lista de técnicos (id_rol=2)', async () => {
      const tecnicosMock = [
        { id_usuario: 1, nombre: 'Carlos', id_rol: 2 },
        { id_usuario: 2, nombre: 'Miguel', id_rol: 2 },
      ];
      Usuario.findAll.mockResolvedValue(tecnicosMock);

      const req = {};
      const res = mockRes();

      await obtenerTec(req, res);

      expect(Usuario.findAll).toHaveBeenCalledWith({ where: { id_rol: 2 } });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tecnicosMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe devolver 200 y arreglo vacío si no hay técnicos', async () => {
      Usuario.findAll.mockResolvedValue([]);

      const req = {};
      const res = mockRes();

      await obtenerTec(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Usuario.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerTec(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});