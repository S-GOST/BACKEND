// test/Pruebas unitarias/crearOrden.test.js

// 1. Mocks de modelos (con virtual: true)
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

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// 2. Mock de db.js con getConnection
jest.mock('../../config/db.js', () => ({
  getConnection: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}));

const { crearOrden } = require('../../controllers/ordenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Helper para crear un mock de connection
const createMockConnection = () => ({
  beginTransaction: jest.fn(),
  query: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
});

describe('crearOrden', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConnection = createMockConnection();
    pool.getConnection.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de autenticación', () => {
    test('Debe devolver 401 si req.admin no está presente', async () => {
      const req = { body: {} }; // Sin req.admin
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no autenticado'
      });
    });
  });

  describe('Obtención de cliente desde token', () => {
    test('Caso 1: Debe obtener cliente desde tokenData.id_usuario', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 5 }];
      const ordenResult = { insertId: 100 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])  // Buscar cliente por id_usuario
        .mockResolvedValueOnce([motoData, []])      // Buscar moto del cliente
        .mockResolvedValueOnce([ordenResult, []])   // Insertar orden
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // Update total

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.query).toHaveBeenNthCalledWith(1,
        'SELECT id_usuario, estado FROM usuarios WHERE id_usuario = ?',
        [10]
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Caso 2: Debe obtener cliente desde tokenData.numero_documento', async () => {
      const clienteData = [{ id_usuario: 20, estado: 'Activo' }];
      const motoData = [{ id_moto: 6 }];
      const ordenResult = { insertId: 101 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { numero_documento: '12345678' },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.query).toHaveBeenNthCalledWith(1,
        'SELECT id_usuario, estado FROM usuarios WHERE numero_documento = ?',
        ['12345678']
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Caso 3: Debe obtener cliente desde tokenData.id (login de clientes)', async () => {
      const clienteData = [{ id_usuario: 30, estado: 'Activo' }];
      const motoData = [{ id_moto: 7 }];
      const ordenResult = { insertId: 102 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id: '87654321' },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.query).toHaveBeenNthCalledWith(1,
        'SELECT id_usuario, estado FROM usuarios WHERE numero_documento = ?',
        ['87654321']
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe devolver 401 si el cliente no se encuentra en la BD', async () => {
      mockConnection.query.mockResolvedValueOnce([[], []]); // Cliente no encontrado

      const req = { 
        admin: { id_usuario: 999 },
        body: {}
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado en la base de datos'
      });
    });

    test('Debe devolver 400 si el cliente no está activo', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Inactivo' }];
      mockConnection.query.mockResolvedValueOnce([clienteData, []]);

      const req = { 
        admin: { id_usuario: 10 },
        body: {}
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El cliente debe estar activo para crear órdenes'
      });
    });
  });

  describe('Manejo de moto', () => {
    test('Debe usar id_moto si viene directamente en el body', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const ordenResult = { insertId: 100 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { id_moto: 5, detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      // No debe buscar moto, solo insertar orden
      expect(mockConnection.query).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO orden_servicio'),
        expect.arrayContaining([10, 1, 5]) // clienteId, tecnicoId, idMoto
      );
    });

    test('Debe insertar moto nueva si viene objeto moto con placa', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoResult = { insertId: 15 };
      const ordenResult = { insertId: 100 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoResult, []])  // Insertar moto
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { 
          moto: { 
            placa: 'ABC-123', 
            marca: 'Yamaha', 
            modelo: 'FZ', 
            cilindraje: 150, 
            kilometraje: 5000 
          },
          detalles: []
        }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO motos'),
        [10, 'ABC-123', 'Yamaha', 'FZ', 150, 5000]
      );
    });

    test('Debe buscar última moto del cliente si no se especifica', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 8 }];
      const ordenResult = { insertId: 100 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])  // Buscar moto
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.query).toHaveBeenNthCalledWith(2,
        'SELECT id_moto FROM motos WHERE id_cliente = ? ORDER BY id_moto DESC LIMIT 1',
        [10]
      );
    });

    test('Debe devolver 400 si no hay motos asociadas al cliente', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      
      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([[], []]); // Sin motos

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No se encontró ninguna moto asociada a este cliente'
      });
    });
  });

  describe('Creación exitosa con detalles', () => {
    test('Debe crear orden con servicios y productos correctamente', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 5 }];
      const ordenResult = { insertId: 100 };
      const servicioData = [{ Precio: 50 }];
      const productoData = [{ Nombre: 'Aceite', Precio: 25, stock: 10 }];

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])  // Insertar orden
        .mockResolvedValueOnce([servicioData, []])  // Precio servicio
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Insertar detalle 1
        .mockResolvedValueOnce([productoData, []])  // Info producto
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Update stock
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Insertar detalle 2
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // Update total

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        user: { id_usuario: 10 },
        body: { 
          detalles: [
            { ID_SERVICIOS: 1, cantidad: 1 },
            { ID_PRODUCTOS: 5, cantidad: 2 }
          ]
        }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(logHistory).toHaveBeenCalledWith(
        10,
        'orden_servicio',
        100,
        'INSERT',
        'Se creó la orden de servicio #100'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id_orden: 100,
          id_moto: 5,
          detalles_insertados: 2
        }
      });
    });

    test('Debe descontar stock cuando se agregan productos', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 5 }];
      const ordenResult = { insertId: 100 };
      const productoData = [{ Nombre: 'Filtro', precio_venta: 15, stock: 5 }];

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([productoData, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Update stock
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Insertar detalle
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // Update total

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { 
          detalles: [{ ID_PRODUCTOS: 5, cantidad: 2 }]
        }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE productos SET stock = stock - ? WHERE ID_PRODUCTOS = ?',
        [2, 5]
      );
    });

    test('Debe devolver 400 si el stock es insuficiente', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 5 }];
      const ordenResult = { insertId: 100 };
      const productoData = [{ Nombre: 'Filtro', Precio: 15, stock: 1 }];

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([productoData, []]); // Stock insuficiente

      const req = { 
        admin: { id_usuario: 10 },
        body: { 
          detalles: [{ ID_PRODUCTOS: 5, cantidad: 5 }] // Pide 5, solo hay 1
        }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Stock insuficiente para el producto Filtro. Stock actual: 1'
      });
    });

    test('Debe devolver 400 si el servicio del detalle no existe', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 5 }];
      const ordenResult = { insertId: 100 };

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([[], []]);

      const req = {
        admin: { id_usuario: 10 },
        body: { detalles: [{ ID_SERVICIOS: 999, cantidad: 1 }] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El servicio con ID 999 no existe'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe hacer rollback y devolver 500 si falla alguna consulta', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const dbError = new Error('Error de conexión');

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockRejectedValueOnce(dbError);

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión'
      });
    });

    test('Debe hacer rollback si falla el commit', async () => {
      const clienteData = [{ id_usuario: 10, estado: 'Activo' }];
      const motoData = [{ id_moto: 5 }];
      const ordenResult = { insertId: 100 };
      const commitError = new Error('Error al hacer commit');

      mockConnection.query
        .mockResolvedValueOnce([clienteData, []])
        .mockResolvedValueOnce([motoData, []])
        .mockResolvedValueOnce([ordenResult, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      mockConnection.commit.mockRejectedValue(commitError);

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});