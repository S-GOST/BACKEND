import { loginCliente } from "../controllers/clientesController";
import bcrypt from 'bcrypt';
import Usuario from '../models/usuarioModel.js';
import { generarTokens, setRefreshTokenCookie } from '../middleware/refreshToken.js';

//MOCKS
jest.mock('../models/usuarioModel.js', () => ({
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

jest.mock('../middleware/refreshToken.js', () => ({
  generarTokens: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}));

jest.mock('../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

//TEST 1
test('Debe devolver 401 si el usuario no existe', async () => {
    Usuario.findOneWithPassword.mockResolvedValue(null); // Simula que no se encuentra el usuario

    const req = { body: { usuario: 'test', contrasena: '1234' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await loginCliente(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Credenciales inválidas' });
});

//TEST 2
test('Debe devolver 401 si la contraseña es incorrecta', async () => {
    Usuario.findOneWithPassword.mockResolvedValue({
        nombre: 'Test User',
        password: 'hashedPassword'
    });

    bcrypt.compare.mockResolvedValue(false); // Simula que la contraseña no coincide

    const req = { body: { usuario: 'test', contrasena: 'wrongPassword' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await loginCliente(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Credenciales inválidas' });
});

//TEST 3
test('Debe devolver 200 y los datos del usuario si las credenciales son correctas', async () => {
    const fakeUser = {
        id_usuario: 1,
        nombre: 'Test User',
        password: 'hashedPassword'
    };

    Usuario.findOneWithPassword.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true); // Simula que la contraseña coincide

    generarTokens.mockReturnValue({
        accessToken: 'fakeAccessToken',
        refreshToken: 'fakeRefreshToken'
    });

    const req = { body: { usuario: 'test', contrasena: 'correctPassword' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await loginCliente(req, res);

    // El controlador usa res.json(...) directo, sin llamar antes a res.status(200)
    expect(res.status).not.toHaveBeenCalledWith(200);
    expect(setRefreshTokenCookie).toHaveBeenCalledWith(res, 'fakeRefreshToken');
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'fakeAccessToken',
        nombre: 'Test User',
        rol: 'cliente',
        id_usuario: 1
    });
});

//TEST 4
test('Debe devolver 500 si ocurre un error interno del servidor', async () => {
    Usuario.findOneWithPassword.mockRejectedValue(new Error('Database error'));

    const req = { body: { usuario: 'test', contrasena: '1234' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await loginCliente(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error interno del servidor' });
});