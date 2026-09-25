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

// Mock de prisma
jest.mock('../../config/prisma.js', () => {
  const prismaMock = {
    $transaction: jest.fn(async (cb) => {
      // In tests, just execute the callback with the prisma mock itself!
      // This allows spying on tx.usuarios.findFirst as prisma.usuarios.findFirst
      return await cb(prismaMock);
    }),
    usuarios: { findFirst: jest.fn() },
    motos: { create: jest.fn(), findFirst: jest.fn() },
    orden_servicio: { create: jest.fn(), update: jest.fn() },
    servicios: { findUnique: jest.fn() },
    productos: { findUnique: jest.fn(), update: jest.fn() },
    detalles_orden_servicio: { create: jest.fn(), aggregate: jest.fn() }
  };
  return {
    __esModule: true,
    default: prismaMock
  };
}, { virtual: true });

const { crearOrden } = require('../../controllers/ordenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const prisma = require('../../config/prisma.js').default;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de autenticación', () => {
    test('Debe devolver 401 si req.admin no está presente', async () => {
      const req = { body: {} }; // Sin req.admin ni req.user
      const res = mockRes();

      await crearOrden(req, res);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no autenticado'
      });
    });
  });

  describe('Obtención de cliente desde token', () => {
    test('Caso 1: Debe obtener cliente desde tokenData.id_usuario', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoData = { id_moto: 5 };
      const ordenResult = { id_orden: 100 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(prisma.usuarios.findFirst).toHaveBeenCalledWith({
        where: { id_usuario: 10 },
        select: { id_usuario: true, estado: true }
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Caso 2: Debe obtener cliente desde tokenData.numero_documento', async () => {
      const clienteData = { id_usuario: 20, estado: 'Activo' };
      const motoData = { id_moto: 6 };
      const ordenResult = { id_orden: 101 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { numero_documento: '12345678' },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(prisma.usuarios.findFirst).toHaveBeenCalledWith({
        where: { numero_documento: BigInt('12345678') },
        select: { id_usuario: true, estado: true }
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Caso 3: Debe obtener cliente desde tokenData.id (login de clientes)', async () => {
      const clienteData = { id_usuario: 30, estado: 'Activo' };
      const motoData = { id_moto: 7 };
      const ordenResult = { id_orden: 102 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id: '87654321' },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(prisma.usuarios.findFirst).toHaveBeenCalledWith({
        where: { numero_documento: BigInt('87654321') },
        select: { id_usuario: true, estado: true }
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe devolver 401 si el cliente no se encuentra en la BD', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null); // Cliente no encontrado

      const req = { 
        admin: { id_usuario: 999 },
        body: {}
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado en la base de datos'
      });
    });

    test('Debe devolver 400 si el cliente no está activo', async () => {
      const clienteData = { id_usuario: 10, estado: 'Inactivo' };
      prisma.usuarios.findFirst.mockResolvedValue(clienteData);

      const req = { 
        admin: { id_usuario: 10 },
        body: {}
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El cliente debe estar activo para crear órdenes'
      });
    });
  });

  describe('Manejo de moto', () => {
    test('Debe usar id_moto si viene directamente en el body', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const ordenResult = { id_orden: 100 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { id_moto: 5, detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      // No debe buscar moto, solo insertar orden
      expect(prisma.motos.findFirst).not.toHaveBeenCalled();
      expect(prisma.motos.create).not.toHaveBeenCalled();
      expect(prisma.orden_servicio.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_cliente: 10,
          id_moto: 5,
        })
      });
    });

    test('Debe insertar moto nueva si viene objeto moto con placa', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoResult = { id_moto: 15 };
      const ordenResult = { id_orden: 100 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.create.mockResolvedValue(motoResult);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);

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

      expect(prisma.motos.create).toHaveBeenCalledWith({
        data: {
          id_cliente: 10,
          placa: 'ABC-123',
          marca: 'Yamaha',
          modelo: 'FZ',
          cilindraje: 150,
          kilometraje: 5000
        }
      });
    });

    test('Debe buscar última moto del cliente si no se especifica', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoData = { id_moto: 8 };
      const ordenResult = { id_orden: 100 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(prisma.motos.findFirst).toHaveBeenCalledWith({
        where: { id_cliente: 10 },
        orderBy: { id_moto: 'desc' }
      });
    });

    test('Debe devolver 400 si no hay motos asociadas al cliente', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      
      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(null); // Sin motos

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No se encontró ninguna moto asociada a este cliente'
      });
    });
  });

  describe('Creación exitosa con detalles', () => {
    test('Debe crear orden con servicios y productos correctamente', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoData = { id_moto: 5 };
      const ordenResult = { id_orden: 100 };
      const servicioData = { Precio: 50 };
      const productoData = { Nombre: 'Aceite', Precio: 25, stock: 10 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);
      prisma.servicios.findUnique.mockResolvedValue(servicioData);
      prisma.productos.findUnique.mockResolvedValue(productoData);
      prisma.productos.update.mockResolvedValue({});
      prisma.detalles_orden_servicio.create.mockResolvedValue({});
      prisma.detalles_orden_servicio.aggregate.mockResolvedValue({ _sum: { subtotal: 100 } });
      prisma.orden_servicio.update.mockResolvedValue({});

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

      expect(prisma.$transaction).toHaveBeenCalled();
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
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoData = { id_moto: 5 };
      const ordenResult = { id_orden: 100 };
      const productoData = { Nombre: 'Filtro', precio_venta: 15, stock: 5 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);
      prisma.productos.findUnique.mockResolvedValue(productoData);
      prisma.productos.update.mockResolvedValue({});
      prisma.detalles_orden_servicio.create.mockResolvedValue({});
      prisma.detalles_orden_servicio.aggregate.mockResolvedValue({ _sum: { subtotal: 30 } });
      prisma.orden_servicio.update.mockResolvedValue({});

      logHistory.mockResolvedValue();

      const req = { 
        admin: { id_usuario: 10 },
        body: { 
          detalles: [{ ID_PRODUCTOS: 5, cantidad: 2 }]
        }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(prisma.productos.update).toHaveBeenCalledWith({
        where: { ID_PRODUCTOS: 5 },
        data: { stock: { decrement: 2 } }
      });
    });

    test('Debe devolver 400 si el stock es insuficiente', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoData = { id_moto: 5 };
      const ordenResult = { id_orden: 100 };
      const productoData = { Nombre: 'Filtro', Precio: 15, stock: 1 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);
      prisma.productos.findUnique.mockResolvedValue(productoData); // Stock insuficiente

      const req = { 
        admin: { id_usuario: 10 },
        body: { 
          detalles: [{ ID_PRODUCTOS: 5, cantidad: 5 }] // Pide 5, solo hay 1
        }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Stock insuficiente para el producto Filtro. Stock actual: 1'
      });
    });

    test('Debe devolver 400 si el servicio del detalle no existe', async () => {
      const clienteData = { id_usuario: 10, estado: 'Activo' };
      const motoData = { id_moto: 5 };
      const ordenResult = { id_orden: 100 };

      prisma.usuarios.findFirst.mockResolvedValue(clienteData);
      prisma.motos.findFirst.mockResolvedValue(motoData);
      prisma.orden_servicio.create.mockResolvedValue(ordenResult);
      prisma.servicios.findUnique.mockResolvedValue(null);

      const req = {
        admin: { id_usuario: 10 },
        body: { detalles: [{ ID_SERVICIOS: 999, cantidad: 1 }] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El servicio con ID 999 no existe'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla alguna consulta', async () => {
      const dbError = new Error('Error de conexión');

      prisma.$transaction.mockRejectedValue(dbError);

      const req = { 
        admin: { id_usuario: 10 },
        body: { detalles: [] }
      };
      const res = mockRes();

      await crearOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de conexión'
      });
    });
  });
});