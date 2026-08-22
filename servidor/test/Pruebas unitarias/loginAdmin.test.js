// test/Pruebas unitarias/loginAdmin.test.js

// 1. Mocks de modelos (con virtual: true para evitar errores de ruta)
jest.mock('../../models/usuarioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    findOneWithPassword: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// 2. Mock de bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

// 3. Mock del middleware refreshToken
jest.mock('../../middleware/refreshToken.js', () => ({
  generarTokens: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}));

// Mock de seguridad para db.js (evita el error de import.meta)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}), { virtual: true });

const { loginAdmin } = require('../../controllers/adminController.js');
const Usuario = require('../../models/usuarioModel.js').default;
const bcrypt = require('bcrypt');
const { generarTokens, setRefreshTokenCookie } = require('../../middleware/refreshToken.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('loginAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Login exitoso', () => {
    test('Debe devolver 200, accessToken y datos del admin con credenciales válidas', async () => {
      const bodyMock = { 
        usuario: 'admin123', 
        contrasena: 'miPassword123' 
      };
      const usuarioMock = {
        id_usuario: 10,
        usuario: 'admin123',
        password: '$2b$10$hashEncriptadoDeLaPassword',
        nombre: 'Administrador Principal',
        id_rol: 1,
        estado: 'Activo'
      };
      const tokensMock = {
        accessToken: 'access.jwt.token.aqui',
        refreshToken: 'refresh.jwt.token.aqui'
      };

      Usuario.findOneWithPassword.mockResolvedValue(usuarioMock);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockReturnValue(tokensMock);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: { usuario: 'admin123', id_rol: 1 }
      });
      
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'miPassword123',
        '$2b$10$hashEncriptadoDeLaPassword'
      );
      
      expect(generarTokens).toHaveBeenCalledWith(usuarioMock);
      expect(setRefreshTokenCookie).toHaveBeenCalledWith(res, 'refresh.jwt.token.aqui');
      
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'access.jwt.token.aqui',
        nombre: 'Administrador Principal',
        rol: 'admin',
        id_usuario: 10
      });
    });

    test('Debe setear cookie httpOnly con refreshToken', async () => {
      const bodyMock = { usuario: 'admin123', contrasena: 'pass123' };
      const usuarioMock = {
        id_usuario: 5,
        usuario: 'admin123',
        password: 'hash',
        nombre: 'Admin',
        id_rol: 1
      };
      const tokensMock = {
        accessToken: 'access.token',
        refreshToken: 'refresh.token'
      };

      Usuario.findOneWithPassword.mockResolvedValue(usuarioMock);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockReturnValue(tokensMock);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(setRefreshTokenCookie).toHaveBeenCalledWith(res, 'refresh.token');
    });
  });

  describe('Credenciales inválidas (401)', () => {
    test('Debe devolver 401 si el usuario no existe', async () => {
      const bodyMock = { 
        usuario: 'usuarioInexistente', 
        contrasena: 'cualquierPassword' 
      };

      Usuario.findOneWithPassword.mockResolvedValue(null);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: { usuario: 'usuarioInexistente', id_rol: 1 }
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generarTokens).not.toHaveBeenCalled();
      expect(setRefreshTokenCookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });

    test('Debe devolver 401 si la contraseña es incorrecta', async () => {
      const bodyMock = { 
        usuario: 'admin123', 
        contrasena: 'passwordIncorrecta' 
      };
      const usuarioMock = {
        id_usuario: 10,
        usuario: 'admin123',
        password: '$2b$10$hashReal',
        nombre: 'Admin',
        id_rol: 1
      };

      Usuario.findOneWithPassword.mockResolvedValue(usuarioMock);
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('passwordIncorrecta', '$2b$10$hashReal');
      expect(generarTokens).not.toHaveBeenCalled();
      expect(setRefreshTokenCookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });

    test('No debe filtrar usuarios que no sean admin (id_rol !== 1)', async () => {
      const bodyMock = { 
        usuario: 'clienteUsuario', 
        contrasena: 'clientePass' 
      };

      Usuario.findOneWithPassword.mockResolvedValue(null);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(Usuario.findOneWithPassword).toHaveBeenCalledWith({
        where: { usuario: 'clienteUsuario', id_rol: 1 }
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales inválidas'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la búsqueda del usuario', async () => {
      const bodyMock = { usuario: 'admin123', contrasena: 'pass' };
      const dbError = new Error('Error de conexión a la BD');

      Usuario.findOneWithPassword.mockRejectedValue(dbError);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generarTokens).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    test('Debe devolver 500 si falla bcrypt.compare', async () => {
      const bodyMock = { usuario: 'admin123', contrasena: 'pass' };
      const usuarioMock = {
        id_usuario: 10,
        usuario: 'admin123',
        password: 'hash',
        nombre: 'Admin',
        id_rol: 1
      };
      const bcryptError = new Error('Error en bcrypt');

      Usuario.findOneWithPassword.mockResolvedValue(usuarioMock);
      bcrypt.compare.mockRejectedValue(bcryptError);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(generarTokens).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    test('Debe devolver 500 si falla generarTokens', async () => {
      const bodyMock = { usuario: 'admin123', contrasena: 'pass' };
      const usuarioMock = {
        id_usuario: 10,
        usuario: 'admin123',
        password: 'hash',
        nombre: 'Admin',
        id_rol: 1
      };
      const tokenError = new Error('Error al generar token');

      Usuario.findOneWithPassword.mockResolvedValue(usuarioMock);
      bcrypt.compare.mockResolvedValue(true);
      generarTokens.mockImplementation(() => { throw tokenError; });

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(setRefreshTokenCookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    test('Debe capturar el error en console.error con el prefijo correcto', async () => {
      const bodyMock = { usuario: 'admin123', contrasena: 'pass' };
      const dbError = new Error('Error específico de login');
      const consoleSpy = jest.spyOn(console, 'error');

      Usuario.findOneWithPassword.mockRejectedValue(dbError);

      const req = { body: bodyMock };
      const res = mockRes();

      await loginAdmin(req, res);

      expect(consoleSpy).toHaveBeenCalledWith("Error en el login:", dbError);
    });
  });
});