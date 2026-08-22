// test/Pruebas unitarias/obtenerMisInformes.test.js

// 1. Mocks de modelos (con virtual: true por si el controlador los importa)
jest.mock('../../models/informeModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

// 2. Mock de db.js (SIN virtual, porque necesitamos usar pool.query directamente)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

// Importamos el controlador y el pool simulado
const { obtenerMisInformes } = require('../../controllers/informeController.js');
const pool = require('../../config/db.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerMisInformes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de autenticación', () => {
    test('Debe devolver 401 si no hay req.user ni req.admin', async () => {
      const req = {};
      const res = mockRes();

      await obtenerMisInformes(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        error: 'No autenticado' 
      });
    });

    test('Debe usar req.admin si req.user no está presente', async () => {
      const usuarioRows = [{ id_usuario: 20 }];
      // mysql2 devuelve [rows, fields]
      pool.query.mockResolvedValueOnce([usuarioRows, []]) 
                .mockResolvedValueOnce([[], []]);
              
      const req = { admin: { id_usuario: 'admin1' } };
      const res = mockRes();
      
      await obtenerMisInformes(req, res);
      
      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT id_usuario FROM usuarios WHERE numero_documento = ? OR id_usuario = ?',
        ['admin1', 'admin1']
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el técnico no existe en la base de datos', async () => {
      // Simulamos que la primera query no encuentra al usuario (array vacío)
      pool.query.mockResolvedValueOnce([[], []]); 
      
      const req = { user: { id_usuario: '999' } };
      const res = mockRes();

      await obtenerMisInformes(req, res);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id_usuario FROM usuarios WHERE numero_documento = ? OR id_usuario = ?',
        ['999', '999']
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Técnico no encontrado' 
      });
    });
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y los informes del técnico autenticado', async () => {
      const usuarioRows = [{ id_usuario: 10 }];
      const informesRows = [
        { id_informe: 1, id_tecnico: 10, fecha: '2024-02-01' },
        { id_informe: 2, id_tecnico: 10, fecha: '2024-01-01' }
      ];
      
      // Secuencia de queries: 1ra busca usuario, 2da busca informes
      pool.query.mockResolvedValueOnce([usuarioRows, []]) 
                .mockResolvedValueOnce([informesRows, []]); 
              
      const req = { user: { id_usuario: '12345' } };
      const res = mockRes();
      
      await obtenerMisInformes(req, res);
      
      expect(pool.query).toHaveBeenCalledTimes(2);
      
      // Validamos la primera query (búsqueda de usuario)
      expect(pool.query).toHaveBeenNthCalledWith(1, 
        'SELECT id_usuario FROM usuarios WHERE numero_documento = ? OR id_usuario = ?',
        ['12345', '12345']
      );
      
      // Validamos la segunda query (búsqueda de informes usando el id real)
      expect(pool.query).toHaveBeenNthCalledWith(2,
        'SELECT * FROM informe WHERE id_tecnico = ? ORDER BY fecha DESC',
        [10] // idTecnicoReal extraído de usuarioRows[0].id_usuario
      );
      
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: informesRows });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la primera consulta (búsqueda de usuario)', async () => {
      pool.query.mockRejectedValueOnce(new Error('Error de conexión'));
      
      const req = { user: { id_usuario: '1' } };
      const res = mockRes();
      
      await obtenerMisInformes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión'
      });
    });

    test('Debe devolver 500 si falla la segunda consulta (búsqueda de informes)', async () => {
      const usuarioRows = [{ id_usuario: 10 }];
      pool.query.mockResolvedValueOnce([usuarioRows, []])
                .mockRejectedValueOnce(new Error('Timeout en query de informes'));
      
      const req = { user: { id_usuario: '1' } };
      const res = mockRes();
      
      await obtenerMisInformes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Timeout en query de informes'
      });
    });
  });
});