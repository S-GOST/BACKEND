// Importamos el controlador y herramientas que este usa
import { loginTecnico } from "../controllers/tecnicoController";
import bcrypt from 'bcrypt';
import Usuario from '@models/usuarioModel.js';
import { generarTokens, setRefreshTokenCookie } from '@middleware/refreshToken.js';

// Mocks (Jest los hoistea automáticamente al inicio, antes de evaluar los imports)
jest.mock('@config/db.js', () => ({
  query: jest.fn().mockResolvedValue([]),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

jest.mock('@models/historialModel.js', () => ({
  __esModule: true,
  default: {
    logHistorial: jest.fn(),
    registrarAccion: jest.fn(),
    // Añade aquí otros métodos si los usa tu controlador o logger
  },
}));

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

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('@middleware/refreshToken.js', () => ({
  generarTokens: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}));

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Suite de pruebas
describe('loginTecnico', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de credenciales', () => {
    test('Debe devolver 401 si el usuario no existe', async () => {
      Usuario.findOneWithPassword.mockResolvedValue(null);

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginTecnico(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: { id_rol: 2, usuario: 'test' }
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });

    test('Debe devolver 401 si la contraseña es incorrecta', async () => {
      const fakeUser = { id_usuario: 1, nombre: 'Test User', password: 'hashedPassword' };
      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { usuario: 'test', contrasena: 'wrongPassword' } };
      const res = mockRes();

      await loginTecnico(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });

    test('Debe devolver 200 y los datos del usuario si las credenciales son correctas', async () => {
      const fakeUser = { id_usuario: 1, nombre: 'Test User', password: 'hashedPassword' };
      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockReturnValue({
        accessToken: 'fakeAccessToken',
        refreshToken: 'fakeRefreshToken'
      });

      const req = { body: { usuario: 'test', contrasena: 'correctPassword' } };
      const res = mockRes();

      await loginTecnico(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: { id_rol: 2, usuario: 'test' }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
      expect(generarTokens).toHaveBeenCalledWith(fakeUser);
      expect(setRefreshTokenCookie).toHaveBeenCalledWith(res, 'fakeRefreshToken');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'fakeAccessToken',
        nombre: 'Test User',
        rol: 'tecnico',
        id_usuario: 1
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si ocurre un error en la base de datos', async () => {
      Usuario.findOneWithPassword.mockRejectedValue(new Error('Database error'));
      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginTecnico(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    test('Debe devolver 500 si bcrypt falla', async () => {
      const fakeUser = { id_usuario: 1, nombre: 'Test User', password: 'hashedPassword' };
      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockRejectedValue(new Error('bcrypt error'));

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginTecnico(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    test('Debe devolver 500 si la generación de tokens falla', async () => {
      const fakeUser = { id_usuario: 1, nombre: 'Test User', password: 'hashedPassword' };
      Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockImplementation(() => {
        throw new Error('Token generation error');
      });

      const req = { body: { usuario: 'test', contrasena: '1234' } };
      const res = mockRes();

      await loginTecnico(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });
  });
});