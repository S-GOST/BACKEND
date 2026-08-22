// test/Pruebas unitarias/generarReporte.test.js

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

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// 2. Mock de db.js (SIN virtual, necesitamos usar pool.query directamente)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

// Importamos el controlador, logger y pool simulados
const { generarReporte } = require('../../controllers/informeController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('generarReporte', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de roles', () => {
    test('Debe devolver 403 si el usuario es cliente (rol 3)', async () => {
      const bodyMock = { fecha_inicio: '2024-01-01', fecha_fin: '2024-01-31' };
      
      const req = { body: bodyMock, user: { id_rol: 3, id_usuario: 5 } };
      const res = mockRes();

      await generarReporte(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Acceso denegado' 
      });
    });

    test('Debe filtrar por id_tecnico si el usuario es técnico (rol 2)', async () => {
      const bodyMock = { fecha_inicio: '2024-01-01', fecha_fin: '2024-01-31' };
      const informesMock = [
        { id_informe: 1, id_tecnico: 10, fecha: '2024-01-15' },
        { id_informe: 2, id_tecnico: 10, fecha: '2024-01-20' }
      ];
      
      pool.query.mockResolvedValue([informesMock, []]);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_rol: 2, id_usuario: 10 } };
      const res = mockRes();

      await generarReporte(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM informe WHERE DATE(fecha) BETWEEN ? AND ? AND id_tecnico = ? ORDER BY fecha DESC',
        ['2024-01-01', '2024-01-31', 10]
      );
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'informe',
        0,
        'REPORT',
        'Generó reporte de informes desde 2024-01-01 hasta 2024-01-31'
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: informesMock });
    });

    test('Debe mostrar todos los informes si el usuario es admin (rol 1)', async () => {
      const bodyMock = { fecha_inicio: '2024-01-01', fecha_fin: '2024-01-31' };
      const informesMock = [
        { id_informe: 1, id_tecnico: 10, fecha: '2024-01-15' },
        { id_informe: 2, id_tecnico: 15, fecha: '2024-01-20' }
      ];
      
      pool.query.mockResolvedValue([informesMock, []]);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_rol: 1, id_usuario: 1 } };
      const res = mockRes();

      await generarReporte(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM informe WHERE DATE(fecha) BETWEEN ? AND ? ORDER BY fecha DESC',
        ['2024-01-01', '2024-01-31']
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: informesMock });
    });

    test('Debe usar req.admin si req.user no está presente', async () => {
      const bodyMock = { fecha_inicio: '2024-01-01', fecha_fin: '2024-01-31' };
      const informesMock = [{ id_informe: 1, fecha: '2024-01-15' }];
      
      pool.query.mockResolvedValue([informesMock, []]);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, admin: { id_rol: 1, id_usuario: 99 } }; // Sin req.user
      const res = mockRes();

      await generarReporte(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        99,
        'informe',
        0,
        'REPORT',
        'Generó reporte de informes desde 2024-01-01 hasta 2024-01-31'
      );
    });
  });

  describe('Casos sin datos (404)', () => {
    test('Debe devolver 404 si no hay informes en el rango de fechas', async () => {
      const bodyMock = { fecha_inicio: '2024-01-01', fecha_fin: '2024-01-31' };
      
      pool.query.mockResolvedValue([[], []]); // Array vacío

      const req = { body: bodyMock, user: { id_rol: 1, id_usuario: 1 } };
      const res = mockRes();

      await generarReporte(req, res);

      expect(pool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Sin datos disponibles' 
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta a la base de datos', async () => {
      const bodyMock = { fecha_inicio: '2024-01-01', fecha_fin: '2024-01-31' };
      const dbError = new Error('Error de conexión a la BD');
      
      pool.query.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_rol: 1, id_usuario: 1 } };
      const res = mockRes();

      await generarReporte(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión a la BD'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});