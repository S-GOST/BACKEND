// test/Pruebas unitarias/eliminarCliente.test.js

const { eliminarCliente } = require('../../controllers/clientesController.js');

// 1. Mocks (se elevan automáticamente al inicio en CJS)
jest.mock('../../models/usuarioModel.js', () => ({
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
}), { virtual: true });

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

jest.mock('../../middleware/refreshToken.js', () => ({
  generarTokens: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}));

jest.mock('../../utils/mailer.js', () => ({
  enviarCorreoAprobacion: jest.fn(),
  enviarCorreoRegistroPendiente: jest.fn(),
}));

// Referencias a los módulos simulados
const Usuario = require('../../models/usuarioModel.js').default;
const { logHistory } = require('../../utils/historyLogger.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eliminarCliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eliminación exitosa', () => {
    test('Debe inhabilitar y devolver mensaje de éxito correctamente', async () => {
      const idMock = '12345678';
      const userMock = { id_usuario: 1, nombre: 'Juan Pérez', id_rol: 3, numero_documento: '12345678' };

      Usuario.findOne.mockResolvedValue(userMock);
      Usuario.update.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id: idMock }, user: { id_usuario: 5 } };
      const res = mockRes();

      await eliminarCliente(req, res);

      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { id_usuario: parseInt(idMock, 10) } });
      expect(Usuario.update).toHaveBeenCalledWith('12345678', { estado: 'Inactivo' });
      expect(logHistory).toHaveBeenCalledWith(5, 'usuarios', 1, 'UPDATE', 'Se inhabilitó el cliente Juan Pérez');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Cliente inhabilitado' });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const idMock = '87654321';
      const userMock = { id_usuario: 2, nombre: 'María López', id_rol: 3, numero_documento: '87654321' };

      Usuario.findOne.mockResolvedValue(userMock);
      Usuario.update.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id: idMock } }; // Sin req.user
      const res = mockRes();

      await eliminarCliente(req, res);

      expect(logHistory).toHaveBeenCalledWith(1, 'usuarios', 2, 'UPDATE', 'Se inhabilitó el cliente María López');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Cliente inhabilitado' });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si no se proporciona un ID válido', async () => {
      const req = { params: {}, user: { id_usuario: 1 } };
      const res = mockRes();

      await eliminarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID (numero_documento o id_usuario) es requerido',
      });
      expect(Usuario.findByPk).not.toHaveBeenCalled();
    });

    test('Debe devolver 404 si el cliente no se encuentra', async () => {
      Usuario.findOne.mockResolvedValue(null);
      Usuario.findByPk.mockResolvedValue(null);

      const req = { params: { id: '12345678' }, user: { id_usuario: 1 } };
      const res = mockRes();

      await eliminarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cliente no encontrado',
      });
      expect(Usuario.update).not.toHaveBeenCalled();
    });

    test('Debe devolver 404 si el usuario encontrado no es rol 3', async () => {
      const userMock = { id_usuario: 5, nombre: 'Admin', id_rol: 1 };
      Usuario.findOne.mockResolvedValue(userMock);

      const req = { params: { id: '12345678' }, user: { id_usuario: 1 } };
      const res = mockRes();

      await eliminarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cliente no encontrado',
      });
      expect(Usuario.update).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const dbError = new Error('Error de conexión a la BD');
      Usuario.findOne.mockRejectedValue(dbError);

      const req = { params: { id: '12345678' }, user: { id_usuario: 1 } };
      const res = mockRes();

      await eliminarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});