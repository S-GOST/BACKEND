// test/eliminarTec.test.js

const { eliminarTec } = require('@controllers/tecnicoController.js');

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

describe('eliminarTec', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Inhabilitación exitosa', () => {
    test('Debe devolver 200 y marcar el técnico como inactivo correctamente', async () => {
      const id = '10';
      const userMock = { id_usuario: 10, nombre: 'Carlos Ruiz', id_rol: 2, estado: 'Activo' };

      Usuario.findByPk.mockResolvedValue(userMock);
      Usuario.update.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id }, user: { id_usuario: 5 } };
      const res = mockRes();

      await eliminarTec(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(Usuario.update).toHaveBeenCalledWith(id, { estado: 'Inactivo' });
      expect(logHistory).toHaveBeenCalledWith(5, 'usuarios', 10, 'DELETE', 'Se inhabilitó el técnico Carlos Ruiz');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Tecnico inhabilitado' });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '11';
      const userMock = { id_usuario: 11, nombre: 'Luis Méndez', id_rol: 2, estado: 'Activo' };

      Usuario.findByPk.mockResolvedValue(userMock);
      Usuario.update.mockResolvedValue();
      logHistory.mockResolvedValue();

      const req = { params: { id } }; // Sin req.user
      const res = mockRes();

      await eliminarTec(req, res);

      expect(logHistory).toHaveBeenCalledWith(1, 'usuarios', 11, 'DELETE', 'Se inhabilitó el técnico Luis Méndez');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Tecnico inhabilitado' });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 404 si el usuario no existe', async () => {
      const id = '99';
      Usuario.findByPk.mockResolvedValue(null);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarTec(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Tecnico no encontrado' });
      expect(Usuario.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 404 si el usuario existe pero no es técnico (id_rol !== 2)', async () => {
      const id = '5';
      const userMock = { id_usuario: 5, nombre: 'Juan Cliente', id_rol: 3, estado: 'Activo' };
      Usuario.findByPk.mockResolvedValue(userMock);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarTec(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Tecnico no encontrado' });
      expect(Usuario.update).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '10';
      const dbError = new Error('Error de conexión a la BD');

      Usuario.findByPk.mockRejectedValue(dbError);

      const req = { params: { id } };
      const res = mockRes();

      await eliminarTec(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Error de conexión a la BD' });
    });
  });
});