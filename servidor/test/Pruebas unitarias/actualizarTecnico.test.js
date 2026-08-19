// test/actualizarTec.test.js

const { actualizarTec } = require('../controllers/tecnicoController.js');

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

describe('actualizarTec', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Actualización exitosa', () => {
    test('Debe devolver el técnico actualizado correctamente', async () => {
      const id = '10';
      const bodyMock = { nombre: 'Carlos Actualizado', correo: 'carlos@nuevo.com', numero_documento: '98765432' };
      // mapToUsuario es interna, retornará automáticamente: { ...bodyMock, id_rol: 2 }
      const payloadEsperado = { ...bodyMock, id_rol: 2 };
      const tecActualizadoMock = { id_usuario: 10, ...payloadEsperado };

      Usuario.update.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(tecActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock, user: { id_usuario: 5 } };
      const res = mockRes();

      await actualizarTec(req, res);

      expect(Usuario.update).toHaveBeenCalledWith(id, payloadEsperado);
      expect(Usuario.findByPk).toHaveBeenCalledWith('98765432'); // Usa numero_documento del payload
      expect(logHistory).toHaveBeenCalledWith(5, 'usuarios', 10, 'UPDATE', 'Se actualizó el técnico Carlos Actualizado');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tecActualizadoMock });
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const id = '11';
      const bodyMock = { nombre: 'Luis Méndez', numero_documento: '11223344' };
      const payloadEsperado = { ...bodyMock, id_rol: 2 };
      const tecActualizadoMock = { id_usuario: 11, ...payloadEsperado };

      Usuario.update.mockResolvedValue();
      Usuario.findByPk.mockResolvedValue(tecActualizadoMock);
      logHistory.mockResolvedValue();

      const req = { params: { id }, body: bodyMock }; // Sin req.user
      const res = mockRes();

      await actualizarTec(req, res);

      expect(logHistory).toHaveBeenCalledWith(1, 'usuarios', 11, 'UPDATE', 'Se actualizó el técnico Luis Méndez');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tecActualizadoMock });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 404 si el usuario no existe o no es técnico después de actualizar', async () => {
      const id = '99';
      const bodyMock = { nombre: 'Prueba', numero_documento: '99999999' };
      
      Usuario.update.mockResolvedValue();
      // Simula que el rol cambió o el usuario no existe
      Usuario.findByPk.mockResolvedValue({ id_usuario: 99, id_rol: 3 }); 

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarTec(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tecnico no encontrado después de actualizar'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 400 si el documento o correo ya existe (ER_DUP_ENTRY)', async () => {
      const id = '10';
      const bodyMock = { correo: 'ya@existe.com', numero_documento: '98765432' };
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';

      Usuario.update.mockRejectedValue(duplicateError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarTec(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El documento o correo ya se encuentra registrado por otro usuario'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const id = '10';
      const bodyMock = { nombre: 'Error', numero_documento: '98765432' };
      const dbError = new Error('Error de conexión a la BD');

      Usuario.update.mockRejectedValue(dbError);

      const req = { params: { id }, body: bodyMock };
      const res = mockRes();

      await actualizarTec(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
    });
  });
});