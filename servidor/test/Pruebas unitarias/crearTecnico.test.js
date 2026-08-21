// test/crearTecnico.test.js

const { crearTec } = require('@controllers/tecnicoController.js');

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

// Referencias a los módulos simulados
const Usuario = require('@models/usuarioModel.js').default;
const { logHistory } = require('@utils/historyLogger.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearTec', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver el técnico creado correctamente', async () => {
      const bodyMock = { nombre: 'Carlos Ruiz', numero_documento: '98765432', correo: 'carlos@tec.com' };
      // mapToUsuario es interna, retornará automáticamente: { ...bodyMock, id_rol: 2 }
      const payloadEsperado = { ...bodyMock, id_rol: 2 };
      const nuevoTecMock = { id_usuario: 10, nombre: 'Carlos Ruiz', numero_documento: '98765432', id_rol: 2 };

      Usuario.create.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(nuevoTecMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 5 } };
      const res = mockRes();

      await crearTec(req, res);

      expect(Usuario.create).toHaveBeenCalledWith(payloadEsperado);
      expect(Usuario.findByPk).toHaveBeenCalledWith('98765432');
      expect(logHistory).toHaveBeenCalledWith(5, 'usuarios', 10, 'INSERT', 'Se creó el técnico Carlos Ruiz');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: nuevoTecMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { nombre: 'Luis Méndez', numero_documento: '11223344' };
      const payloadEsperado = { ...bodyMock, id_rol: 2 };
      const nuevoTecMock = { id_usuario: 11, nombre: 'Luis Méndez', numero_documento: '11223344', id_rol: 2 };

      Usuario.create.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(nuevoTecMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearTec(req, res);

      expect(logHistory).toHaveBeenCalledWith(1, 'usuarios', 11, 'INSERT', 'Se creó el técnico Luis Méndez');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: nuevoTecMock });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el documento o correo ya existe (ER_DUP_ENTRY)', async () => {
      const bodyMock = { nombre: 'Carlos Ruiz', numero_documento: '98765432' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Usuario.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearTec(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El documento o correo ya se encuentra registrado',
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { nombre: 'Carlos Ruiz', numero_documento: '98765432' };
      const dbError = new Error('Error de conexión a la BD');

      Usuario.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearTec(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});