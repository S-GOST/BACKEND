// test/obtenerTecPorId.test.js

const { obtenerTecPorId } = require('../controllers/tecnicoController.js');

// 1. Mocks (se elevan automáticamente al inicio en CJS)
jest.mock('../models/usuarioModel.js', () => ({
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

jest.mock('../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Referencia al modelo simulado
const Usuario = require('../models/usuarioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerTecPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y los datos del técnico si existe y es técnico (id_rol=2)', async () => {
      const tecnicoMock = { id_usuario: 1, nombre: 'Carlos', id_rol: 2 };
      Usuario.findByPk.mockResolvedValue(tecnicoMock);

      const req = { params: { id: '1' } };
      const res = mockRes();

      await obtenerTecPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tecnicoMock });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el usuario no existe', async () => {
      Usuario.findByPk.mockResolvedValue(null);

      const req = { params: { id: '999' } };
      const res = mockRes();

      await obtenerTecPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Tecnico no encontrado' });
    });

    test('Debe devolver 404 si el usuario existe pero no es técnico (id_rol !== 2)', async () => {
      const usuarioMock = { id_usuario: 1, nombre: 'Juan', id_rol: 3 }; // Cliente
      Usuario.findByPk.mockResolvedValue(usuarioMock);

      const req = { params: { id: '1' } };
      const res = mockRes();

      await obtenerTecPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Tecnico no encontrado' });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { params: { id: '1' } };
      const res = mockRes();

      await obtenerTecPorId(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});