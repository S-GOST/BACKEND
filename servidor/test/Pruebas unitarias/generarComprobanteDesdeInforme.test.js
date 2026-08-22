// test/Pruebas unitarias/generarComprobanteDesdeInforme.test.js

// Mocks de modelos
jest.mock('../../models/comprobanteModel.js', () => ({
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

// Mock de db.js (SIN virtual, necesitamos usar pool.query)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

const { generarComprobanteDesdeInforme } = require('../../controllers/comprobanteController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('generarComprobanteDesdeInforme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Generación exitosa', () => {
    test('Debe generar comprobante exitosamente con todos los datos', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '100' };
      const ordenData = { id_orden: '100', id_cliente: 5 };
      const totalData = { monto: 150.50 };
      const existenteVacio = [];
      const countData = { total: 5 };
      const resultInsert = { insertId: 25, affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([[informeData], []])  // Buscar informe
        .mockResolvedValueOnce([[ordenData], []])     // Buscar orden
        .mockResolvedValueOnce([[totalData], []])     // Calcular total
        .mockResolvedValueOnce([existenteVacio, []])  // Verificar existente
        .mockResolvedValueOnce([[countData], []])     // Contar comprobantes
        .mockResolvedValueOnce([resultInsert, []]);   // Insertar comprobante

      logHistory.mockResolvedValue();

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Tarjeta' },
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(pool.query).toHaveBeenCalledTimes(6);
      expect(logHistory).toHaveBeenCalledWith(
        1,
        'comprobante',
        25,
        'INSERT',
        expect.stringContaining('Admin generó comprobante COMP-20240215-0006')
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comprobante generado exitosamente',
        data: {
          id_comprobante: 25,
          id_orden: '100',
          numero_comprobante: 'COMP-20240215-0006',
          subtotal: 150.50,
          total_pagar: 150.50,
          estado: 'Pendiente'
        }
      });
    });

    test('Debe usar "Efectivo" como metodo_pago por defecto si no se proporciona', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '100' };
      const ordenData = { id_orden: '100' };
      const totalData = { monto: 100 };
      const existenteVacio = [];
      const countData = { total: 0 };
      const resultInsert = { insertId: 1, affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([[informeData], []])
        .mockResolvedValueOnce([[ordenData], []])
        .mockResolvedValueOnce([[totalData], []])
        .mockResolvedValueOnce([existenteVacio, []])
        .mockResolvedValueOnce([[countData], []])
        .mockResolvedValueOnce([resultInsert, []]);

      const req = { 
        params: { idInforme }, 
        body: {}, // Sin metodo_pago
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      // Validar que el INSERT usó 'Efectivo'
      expect(pool.query).toHaveBeenNthCalledWith(6,
        expect.stringContaining('INSERT INTO comprobante'),
        expect.arrayContaining(['Efectivo'])
      );
    });

    test('Debe usar req.admin si req.user no está presente', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '100' };
      const ordenData = { id_orden: '100' };
      const totalData = { monto: 100 };
      const existenteVacio = [];
      const countData = { total: 0 };
      const resultInsert = { insertId: 1, affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([[informeData], []])
        .mockResolvedValueOnce([[ordenData], []])
        .mockResolvedValueOnce([[totalData], []])
        .mockResolvedValueOnce([existenteVacio, []])
        .mockResolvedValueOnce([[countData], []])
        .mockResolvedValueOnce([resultInsert, []]);

      logHistory.mockResolvedValue();

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Efectivo' },
        admin: { id_usuario: 99 } // Sin req.user
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        99, // req.admin.id_usuario
        'comprobante',
        1,
        'INSERT',
        expect.any(String)
      );
    });

    test('Debe usar 1 como fallback si ni req.user ni req.admin están presentes', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '100' };
      const ordenData = { id_orden: '100' };
      const totalData = { monto: 100 };
      const existenteVacio = [];
      const countData = { total: 0 };
      const resultInsert = { insertId: 1, affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([[informeData], []])
        .mockResolvedValueOnce([[ordenData], []])
        .mockResolvedValueOnce([[totalData], []])
        .mockResolvedValueOnce([existenteVacio, []])
        .mockResolvedValueOnce([[countData], []])
        .mockResolvedValueOnce([resultInsert, []]);

      logHistory.mockResolvedValue();

      const req = { 
        params: { idInforme }, 
        body: {} 
      }; // Sin req.user ni req.admin
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'comprobante',
        1,
        'INSERT',
        expect.any(String)
      );
    });

    test('Debe manejar correctamente cuando el total es 0', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '100' };
      const ordenData = { id_orden: '100' };
      const totalData = { monto: 0 };
      const existenteVacio = [];
      const countData = { total: 0 };
      const resultInsert = { insertId: 1, affectedRows: 1 };

      pool.query
        .mockResolvedValueOnce([[informeData], []])
        .mockResolvedValueOnce([[ordenData], []])
        .mockResolvedValueOnce([[totalData], []])
        .mockResolvedValueOnce([existenteVacio, []])
        .mockResolvedValueOnce([[countData], []])
        .mockResolvedValueOnce([resultInsert, []]);

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Efectivo' },
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 0,
            total_pagar: 0
          })
        })
      );
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si el informe no existe', async () => {
      const idInforme = '999';

      pool.query.mockResolvedValueOnce([[], []]); // Informe no encontrado

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Efectivo' },
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Informe no encontrado'
      });
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('Debe devolver 404 si la orden asociada no existe', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '999' };

      pool.query
        .mockResolvedValueOnce([[informeData], []]) // Informe encontrado
        .mockResolvedValueOnce([[], []]);            // Orden no encontrada

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Efectivo' },
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Orden de servicio asociada no encontrada'
      });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validaciones de negocio (400)', () => {
    test('Debe devolver 400 si ya existe un comprobante para esta orden', async () => {
      const idInforme = '10';
      const informeData = { id_informe: 10, id_orden: '100' };
      const ordenData = { id_orden: '100' };
      const totalData = { monto: 150 };
      const comprobanteExistente = { id_comprobante: 5, id_orden: '100' };

      pool.query
        .mockResolvedValueOnce([[informeData], []])
        .mockResolvedValueOnce([[ordenData], []])
        .mockResolvedValueOnce([[totalData], []])
        .mockResolvedValueOnce([[comprobanteExistente], []]); // Ya existe

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Efectivo' },
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe un comprobante para esta orden',
        data: comprobanteExistente
      });
      expect(pool.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla alguna consulta', async () => {
      const idInforme = '10';
      const dbError = new Error('Error de conexión');

      pool.query.mockRejectedValue(dbError);

      const req = { 
        params: { idInforme }, 
        body: { metodo_pago: 'Efectivo' },
        user: { id_usuario: 1 } 
      };
      const res = mockRes();

      await generarComprobanteDesdeInforme(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de conexión'
      });
    });
  });
});