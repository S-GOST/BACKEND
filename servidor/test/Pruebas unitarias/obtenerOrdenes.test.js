// test/Pruebas unitarias/obtenerOrdenes.test.js

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
const { obtenerOrdenes } = require('../../controllers/ordenServicioController.js');
const pool = require('../../config/db.js');

// Referencia al modelo simulado
const OrdenServicio = require('../../models/ordenServicioModel.js').default;

// Helper para simular la respuesta de Express
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('obtenerOrdenes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Consulta exitosa', () => {
    test('Debe devolver 200 y las órdenes con sus detalles cargados', async () => {
      const ordenesMock = [
        { ID_ORDEN_SERVICIO: 1, fecha_ingreso: '2024-02-15', estado: 'Pendiente' },
        { ID_ORDEN_SERVICIO: 2, fecha_ingreso: '2024-02-16', estado: 'En Proceso' },
      ];
      
      const detallesOrden1 = [
        { 
          id_detalle: 1, 
          ID_SERVICIOS: 5, 
          ID_PRODUCTOS: null,
          cantidad: 1,
          precio_unitario: 50,
          subtotal: 50,
          NombreServicio: 'Mantenimiento Preventivo'
        }
      ];
      
      const detallesOrden2 = [
        { 
          id_detalle: 2, 
          ID_SERVICIOS: null, 
          ID_PRODUCTOS: 10,
          cantidad: 2,
          precio_unitario: 25,
          subtotal: 50,
          NombreProducto: 'Cable HDMI'
        },
        { 
          id_detalle: 3, 
          ID_SERVICIOS: 3, 
          ID_PRODUCTOS: null,
          cantidad: 1,
          precio_unitario: 100,
          subtotal: 100,
          NombreServicio: 'Instalación de Red'
        }
      ];

      OrdenServicio.findAll.mockResolvedValue(ordenesMock);
      // pool.query se llama una vez por cada orden
      pool.query
        .mockResolvedValueOnce([detallesOrden1, []]) // Detalles de orden 1
        .mockResolvedValueOnce([detallesOrden2, []]); // Detalles de orden 2

      const req = {};
      const res = mockRes();

      await obtenerOrdenes(req, res);

      expect(OrdenServicio.findAll).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledTimes(2);
      
      // Validar que la query se ejecutó con los IDs correctos
      expect(pool.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT'), 
        [1] // ID_ORDEN_SERVICIO de la primera orden
      );
      expect(pool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('SELECT'), 
        [2] // ID_ORDEN_SERVICIO de la segunda orden
      );
      
      // Validar que las órdenes tienen sus detalles adjuntos
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: [
          { ...ordenesMock[0], detalles: detallesOrden1 },
          { ...ordenesMock[1], detalles: detallesOrden2 }
        ]
      });
    });

    test('Debe devolver 200 y órdenes con detalles vacíos si no hay detalles', async () => {
      const ordenesMock = [
        { ID_ORDEN_SERVICIO: 1, fecha_ingreso: '2024-02-15' }
      ];

      OrdenServicio.findAll.mockResolvedValue(ordenesMock);
      pool.query.mockResolvedValueOnce([[], []]); // Sin detalles

      const req = {};
      const res = mockRes();

      await obtenerOrdenes(req, res);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: [
          { ...ordenesMock[0], detalles: [] }
        ]
      });
    });

    test('Debe devolver 200 y arreglo vacío si no hay órdenes', async () => {
      OrdenServicio.findAll.mockResolvedValue([]);
      // pool.query no debería llamarse si no hay órdenes
      pool.query.mockResolvedValue([[], []]);

      const req = {};
      const res = mockRes();

      await obtenerOrdenes(req, res);

      expect(OrdenServicio.findAll).toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla findAll', async () => {
      const dbError = new Error('Error al obtener órdenes');
      OrdenServicio.findAll.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerOrdenes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al obtener órdenes'
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la carga de detalles', async () => {
      const ordenesMock = [
        { ID_ORDEN_SERVICIO: 1, fecha_ingreso: '2024-02-15' }
      ];
      const dbError = new Error('Error al cargar detalles');

      OrdenServicio.findAll.mockResolvedValue(ordenesMock);
      pool.query.mockRejectedValue(dbError);

      const req = {};
      const res = mockRes();

      await obtenerOrdenes(req, res);

      expect(OrdenServicio.findAll).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al cargar detalles'
      });
    });
  });
});