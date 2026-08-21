//Importamos el controlador y herramientas que este usa
import { loginCliente } from "@controllers/clientesController.js";
import bcrypt from 'bcrypt';
import Usuario from '@models/usuarioModel.js';
import { generarTokens, setRefreshTokenCookie } from '@middleware/refreshToken.js';


//Creamos los simulacros esto es clave para remplazar las funciones reales

//El modelo pero simulado
jest.mock('@models/usuarioModel.js', () => ({
  __esModule: true,
  default: {
    findOneWithPassword: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

//La encriptacion de contraseñas simulada

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

//El refres del token simulado

jest.mock('@middleware/refreshToken.js', () => ({
  generarTokens: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}));

//El registro en el historial simulado

jest.mock('@utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// Helper para crear mock de response

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

//Los tests

describe('loginCliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  //Los tests agrupados para mantener el codigo ordenado y legible
  //Test 1
  describe('Validación de credenciales', () => {

    test('Debe devolver 401 si el usuario no existe', async () => {
      Usuario.findOneWithPassword.mockResolvedValue(null);

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: {
          id_rol: 3,
          usuario: 'test'
        }
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });

    //Test 2

    test('Debe devolver 401 si la contraseña es incorrecta', async () => {
      const fakeUser = {
        id_usuario: 1,
        nombre: 'Test User',
        password: 'hashedPassword',
        estado: 'Activo'
      };

      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { usuario: 'test', contrasena: 'wrongPassword' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });

    //Test 3

    test('Debe devolver 200 y los datos del usuario si las credenciales son correctas', async () => {
      const fakeUser = {
        id_usuario: 1,
        nombre: 'Test User',
        password: 'hashedPassword',
        estado: 'Activo'
      };

      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockReturnValue({
        accessToken: 'fakeAccessToken',
        refreshToken: 'fakeRefreshToken'
      });

      const req = { body: { usuario: 'test', contrasena: 'correctPassword' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: {
          id_rol: 3,
          usuario: 'test'
        }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
      expect(generarTokens).toHaveBeenCalledWith(fakeUser);
      expect(setRefreshTokenCookie).toHaveBeenCalledWith(res, 'fakeRefreshToken');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'fakeAccessToken',
        nombre: 'Test User',
        rol: 'cliente',
        id_usuario: 1
      });
    });
  });

  //Test 4

  describe('Validación de datos de entrada', () => {

    test('Debe devolver 400 si falta el usuario', async () => {
      const req = { body: { contrasena: '1234' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('requerid')
      });
    });

    test('Debe devolver 400 si falta la contraseña', async () => {
      const req = { body: { usuario: 'test' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('requerid')
      });
    });

    //Test 5

    test('Debe devolver 400 si el body está vacío', async () => {
      const req = { body: {} };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('requerid')
      });
    });

    //Test 6

    test('Debe devolver 400 si el usuario está vacío', async () => {
      const req = { body: { usuario: '', contrasena: '1234' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('requerid')
      });
    });

    //Test 7

    test('Debe devolver 400 si la contraseña está vacía', async () => {
      const req = { body: { usuario: 'test', contrasena: '' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('requerid')
      });
    });
  });

  //Test 8

  describe('Manejo de errores', () => {

    test('Debe devolver 500 si ocurre un error en la base de datos', async () => {
      Usuario.findOneWithPassword.mockRejectedValue(new Error('Database error'));

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    //Test 9

    test('Debe devolver 500 si bcrypt falla', async () => {
      const fakeUser = {
        id_usuario: 1,
        nombre: 'Test User',
        password: 'hashedPassword',
        estado: 'Activo'
      };

      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockRejectedValue(new Error('bcrypt error'));

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    //Test 10

    test('Debe devolver 500 si la generación de tokens falla', async () => {
      const fakeUser = {
        id_usuario: 1,
        nombre: 'Test User',
        password: 'hashedPassword',
        estado: 'Activo'
      };

      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockImplementation(() => {
        throw new Error('Token generation error');
      });

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });
  });
});