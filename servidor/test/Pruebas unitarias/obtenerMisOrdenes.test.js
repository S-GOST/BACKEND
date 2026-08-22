// test/Pruebas unitarias/obtenerMisOrdenes.test.js

// 1. Mock del modelo (con virtual: true para evitar errores de ruta)
jest.mock('../../models/ordenServicioModel.js', () => ({
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

// 2. Mock de db.js (SIN virtual, necesitamos usar pool.query directamente)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

// Importamos el controlador y pool simulado
const { obtenerMisOrdenes } = require('../../controllers/ordenServicioController.js');
const pool = require('../../config/db.js');

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerMisOrdenes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de autenticación', () => {
    test('Debe devolver 401 si req.user no está presente', async () => {
      const req = {}; // Sin req.user
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no autenticado'
      });
    });

    test('Debe devolver 404 si req.user no tiene id_usuario', async () => {
      const req = { user: { rol: 3 } }; // Sin id_usuario
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado'
      });
    });
  });

  describe('Consulta exitosa según rol', () => {
    test('Debe filtrar por id_tecnico si el usuario es técnico (rol 2)', async () => {
      const ordenesMock = [
        { 
          ID_ORDEN_SERVICIO: 1, 
          ID_TECNICOS: 10,
          Fecha_inicio: '2024-02-15',
          Estado: 'En Proceso',
          PlacaMoto: 'ABC-123'
        }
      ];
      const detallesMock = [
        { 
          id_detalle: 1, 
          ID_SERVICIOS: 5, 
          cantidad: 1,
          precio_unitario: 50,
          subtotal: 50,
          NombreServicio: 'Mantenimiento'
        }
      ];

      pool.query
        .mockResolvedValueOnce([ordenesMock, []])   // Query principal
        .mockResolvedValueOnce([detallesMock, []]); // Detalles de la orden 1

      const req = { user: { id_usuario: 10, rol: 2 } };
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      // Validar que la query principal filtra por id_tecnico
      expect(pool.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('WHERE os.id_tecnico = ?'),
        [10]
      );
      // Validar que la query de detalles se ejecutó con el ID correcto
      expect(pool.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('WHERE d.id_orden = ?'),
        [1]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ ...ordenesMock[0], detalles: detallesMock }]
      });
    });

    test('Debe filtrar por id_cliente si el usuario es cliente (rol 3)', async () => {
      const ordenesMock = [
        { 
          ID_ORDEN_SERVICIO: 5, 
          ID_CLIENTES: 20,
          Fecha_inicio: '2024-02-16',
          Estado: 'Pendiente'
        }
      ];
      const detallesMock = [];

      pool.query
        .mockResolvedValueOnce([ordenesMock, []])
        .mockResolvedValueOnce([detallesMock, []]);

      const req = { user: { id_usuario: 20, rol: 3 } };
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      // Validar que la query principal filtra por id_cliente
      expect(pool.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('WHERE os.id_cliente = ?'),
        [20]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ ...ordenesMock[0], detalles: [] }]
      });
    });

    test('Debe usar filtro por id_cliente como fallback para roles desconocidos', async () => {
      const ordenesMock = [];
      pool.query.mockResolvedValueOnce([ordenesMock, []]);

      const req = { user: { id_usuario: 99, rol: 99 } }; // Rol desconocido
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      // Debe caer al fallback de cliente
      expect(pool.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('WHERE os.id_cliente = ?'),
        [99]
      );
      expect(pool.query).toHaveBeenCalledTimes(1); // No hay loop de detalles
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    test('Debe cargar detalles para múltiples órdenes', async () => {
      const ordenesMock = [
        { ID_ORDEN_SERVICIO: 1 },
        { ID_ORDEN_SERVICIO: 2 },
        { ID_ORDEN_SERVICIO: 3 }
      ];
      const detalles1 = [{ id_detalle: 1 }];
      const detalles2 = [{ id_detalle: 2 }, { id_detalle: 3 }];
      const detalles3 = [];

      pool.query
        .mockResolvedValueOnce([ordenesMock, []])
        .mockResolvedValueOnce([detalles1, []])
        .mockResolvedValueOnce([detalles2, []])
        .mockResolvedValueOnce([detalles3, []]);

      const req = { user: { id_usuario: 10, rol: 2 } };
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      expect(pool.query).toHaveBeenCalledTimes(4); // 1 principal + 3 de detalles
      expect(pool.query).toHaveBeenNthCalledWith(2, expect.any(String), [1]);
      expect(pool.query).toHaveBeenNthCalledWith(3, expect.any(String), [2]);
      expect(pool.query).toHaveBeenNthCalledWith(4, expect.any(String), [3]);
      
      const result = res.json.mock.calls[0][0];
      expect(result.data[0].detalles).toEqual(detalles1);
      expect(result.data[1].detalles).toEqual(detalles2);
      expect(result.data[2].detalles).toEqual(detalles3);
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la consulta principal', async () => {
      const dbError = new Error('Error de conexión en query principal');
      pool.query.mockRejectedValue(dbError);

      const req = { user: { id_usuario: 10, rol: 2 } };
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión en query principal'
      });
    });

    test('Debe devolver 500 si falla la carga de detalles', async () => {
      const ordenesMock = [{ ID_ORDEN_SERVICIO: 1 }];
      const dbError = new Error('Error al cargar detalles');

      pool.query
        .mockResolvedValueOnce([ordenesMock, []])
        .mockRejectedValueOnce(dbError);

      const req = { user: { id_usuario: 10, rol: 2 } };
      const res = mockRes();

      await obtenerMisOrdenes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al cargar detalles'
      });
    });
  });
});