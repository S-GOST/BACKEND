// test/actualizarCliente.test.js

const { actualizarCliente } = require('../controllers/clientesController.js');

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

// Referencias a los módulos simulados
const Usuario = require('../models/usuarioModel.js').default;
const { logHistory } = require('../utils/historyLogger.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('actualizarCliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe actualizar y devolver el cliente correctamente (ID desde params)', async () => {
      const reqBody = { nombre: 'Juan Actualizado', correo: 'nuevo@test.com' };
      const reqParams = { id: '12345678' };
      const payloadEsperado = { ...reqBody, id_rol: 3 }; // mapToUsuario interna
      const userActualizadoMock = { id_usuario: 1, ...reqBody, numero_documento: '12345678', id_rol: 3 };

      Usuario.update.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(userActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { body: reqBody, params: reqParams, user: { id_usuario: 5 } };
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(Usuario.update).toHaveBeenCalledWith(reqParams.id, payloadEsperado);
      expect(Usuario.findByPk).toHaveBeenCalledWith(reqParams.id);
      expect(logHistory).toHaveBeenCalledWith(5, 'usuarios', 1, 'UPDATE', 'Se actualizó el cliente Juan Actualizado');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: userActualizadoMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar req.body.numero_documento como ID cuando req.params.id no existe', async () => {
      const reqBody = { nombre: 'Ana', numero_documento: '87654321' };
      const payloadEsperado = { ...reqBody, id_rol: 3 };
      const userActualizadoMock = { id_usuario: 2, ...reqBody, id_rol: 3 };

      Usuario.update.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(userActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { body: reqBody, params: {}, user: { id_usuario: 10 } };
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(Usuario.update).toHaveBeenCalledWith('87654321', payloadEsperado);
      expect(Usuario.findByPk).toHaveBeenCalledWith('87654321');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: userActualizadoMock });
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const reqBody = { nombre: 'María' };
      const payloadEsperado = { ...reqBody, id_rol: 3 };
      const userActualizadoMock = { id_usuario: 99, ...reqBody, numero_documento: '8888', id_rol: 3 };

      Usuario.update.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(userActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { body: reqBody, params: { id: '8888' } }; // Sin req.user
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(logHistory).toHaveBeenCalledWith(1, 'usuarios', 99, 'UPDATE', 'Se actualizó el cliente María');
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 400 si no se proporciona un ID válido', async () => {
      const req = { body: { nombre: 'Sin ID' }, params: {}, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID (numero_documento) es requerido',
      });
      expect(Usuario.update).not.toHaveBeenCalled();
    });

    test('Debe devolver 400 si hay duplicado (ER_DUP_ENTRY)', async () => {
      const reqBody = { nombre: 'Juan', numero_documento: '12345678' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Usuario.update.mockRejectedValue(duplicateError);

      const req = { body: reqBody, params: { id: '12345678' }, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El documento o correo ya se encuentra registrado por otro usuario',
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 404 si el cliente no se encuentra o no es rol 3', async () => {
      const reqBody = { nombre: 'Juan' };

      Usuario.update.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(null); // Simula que no existe tras actualizar

      const req = { body: reqBody, params: { id: '12345678' }, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cliente no encontrado después de actualizar',
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const reqBody = { nombre: 'Juan' };
      const dbError = new Error('Error de conexión a la BD');

      Usuario.update.mockRejectedValue(dbError);

      const req = { body: reqBody, params: { id: '12345678' }, user: { id_usuario: 1 } };
      const res = mockRes();

      await actualizarCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD',
      });
    });
  });
});