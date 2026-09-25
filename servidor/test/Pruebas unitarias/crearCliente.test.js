// test/crearCliente.test.js

const { crearCliente } = require('@controllers/clientesController.js');

// 1. Mocks (se elevan automáticamente al inicio en CJS)
// Mock de mailer para evitar warnings de test no esperado
jest.mock('../../utils/mailer.js', () => ({
  enviarCorreoRegistroPendiente: jest.fn().mockResolvedValue(true),
}));

jest.mock('@models/usuarioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
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

describe('crearCliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
    Usuario.findOne.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa', () => {
    test('Debe devolver el cliente creado correctamente', async () => {
      const bodyMock = { nombre: 'Juan Pérez', numero_documento: '12345678', correo: 'juan@test.com' };
      // mapToUsuario es interna, retornará automáticamente: { ...bodyMock, id_rol: 3, estado: 'Pendiente' }
      const payloadEsperado = { ...bodyMock, numero_documento: BigInt('12345678'), id_rol: 3, estado: 'Pendiente' };
      const nuevoClienteMock = { id_usuario: 1, nombre: 'Juan Pérez', numero_documento: '12345678', id_rol: 3, estado: 'Pendiente' };

      Usuario.create.mockResolvedValue();
      Usuario.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce(nuevoClienteMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 5 } };
      const res = mockRes();

      await crearCliente(req, res);

      expect(Usuario.create).toHaveBeenCalledWith(payloadEsperado);
      expect(Usuario.findByPk).toHaveBeenCalledWith(BigInt('12345678'));
      expect(logHistory).toHaveBeenCalledWith(5, 'usuarios', 1, 'INSERT', 'Se creó el cliente Juan Pérez');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: nuevoClienteMock }));
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { nombre: 'María López', numero_documento: '87654321' };
      const payloadEsperado = { ...bodyMock, numero_documento: BigInt('87654321'), id_rol: 3, estado: 'Pendiente' };
      const nuevoClienteMock = { id_usuario: 2, nombre: 'María López', numero_documento: '87654321', id_rol: 3, estado: 'Pendiente' };

      Usuario.create.mockResolvedValue();
      Usuario.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce(nuevoClienteMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearCliente(req, res);

      expect(logHistory).toHaveBeenCalledWith(1, 'usuarios', 2, 'INSERT', 'Se creó el cliente María López');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: nuevoClienteMock }));
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si el documento o correo ya existe (P2002)', async () => {
      const bodyMock = { nombre: 'Juan Pérez', numero_documento: '12345678' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'P2002';

      Usuario.create.mockRejectedValue(duplicateError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Un dato ingresado (documento, correo o usuario) ya se encuentra registrado.',
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { nombre: 'Juan Pérez', numero_documento: '12345678' };
      const dbError = new Error('Error de conexión a la BD');

      Usuario.findByPk.mockResolvedValue(null);
      Usuario.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});