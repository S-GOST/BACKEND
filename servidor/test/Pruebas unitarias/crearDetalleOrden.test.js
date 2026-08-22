// test/Pruebas unitarias/crearDetalleOrden.test.js

// 1. Mocks de modelos (con virtual: true para evitar errores de ruta)
jest.mock('../../models/detalleOrdenServicioModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

jest.mock('../../models/serviciosModel.js', () => ({
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

jest.mock('../../models/productosModel.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPk: jest.fn(),
    findByCategoria: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

jest.mock('../../utils/historyLogger.js', () => ({
  logHistory: jest.fn(),
}));

// 2. Mock de db.js (SIN virtual, necesitamos pool.query para UPDATE de stock)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

const { crearDetalleOrden } = require('../../controllers/detalleOrdenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const DetalleOrdenServicio = require('../../models/detalleOrdenServicioModel.js').default;
const Servicio = require('../../models/serviciosModel.js').default;
const Producto = require('../../models/productosModel.js').default;
const pool = require('../../config/db.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearDetalleOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Creación exitosa con servicio', () => {
    test('Debe crear detalle con precio tomado del catálogo de servicios', async () => {
      const bodyMock = {
        ID_ORDEN_SERVICIO: 10,
        ID_SERVICIOS: 5,
        cantidad: 2,
        Garantia: '6 meses'
      };
      const servicioMock = { ID_SERVICIOS: 5, nombre: 'Mantenimiento', Precio: '50.00' };
      const nuevoDetalleMock = { id_detalle: 100, ...bodyMock, precio_unitario: 50, subtotal: 100 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 3 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(Servicio.findById).toHaveBeenCalledWith(5);
      expect(Producto.findById).not.toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled(); // No descuenta stock para servicios
      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_SERVICIOS: 5,
          cantidad: 2,
          precio_unitario: 50,
          subtotal: 100,
          Garantia: '6 meses'
        })
      );
      expect(logHistory).toHaveBeenCalledWith(
        3,
        'detalles_orden_servicio',
        100,
        'INSERT',
        'Se agregó detalle a la orden 10'
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: nuevoDetalleMock
      });
    });

    test('Debe usar precio 0 si el servicio no tiene Precio definido', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 };
      const servicioMock = { ID_SERVICIOS: 5, nombre: 'Sin precio' }; // Sin Precio
      const nuevoDetalleMock = { id_detalle: 101 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          precio_unitario: 0,
          subtotal: 0
        })
      );
    });
  });

  describe('Creación exitosa con producto', () => {
    test('Debe crear detalle con precio tomado del catálogo y descontar stock', async () => {
      const bodyMock = {
        id_orden: 10,
        ID_PRODUCTOS: 3,
        cantidad: 2,
        Garantia: '3 meses'
      };
      const productoMock = { ID_PRODUCTOS: 3, Nombre: 'Aceite', Precio: '25.50', stock: 10 };
      const nuevoDetalleMock = { id_detalle: 102 };

      Producto.findById.mockResolvedValue(productoMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 5 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(Producto.findById).toHaveBeenCalledWith(3);
      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_PRODUCTOS: 3,
          cantidad: 2,
          precio_unitario: 25.50,
          subtotal: 51,
          Garantia: '3 meses'
        })
      );
      // Validar que descontó stock
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE productos SET stock = stock - ? WHERE ID_PRODUCTOS = ?',
        [2, 3]
      );
      expect(logHistory).toHaveBeenCalledWith(
        5,
        'detalles_orden_servicio',
        102,
        'INSERT',
        'Se agregó detalle a la orden 10' // usa id_orden
      );
    });
  });

  describe('Validación de stock (RN-008)', () => {
    test('Debe devolver 400 si el stock es insuficiente', async () => {
      const bodyMock = {
        ID_PRODUCTOS: 3,
        cantidad: 5
      };
      const productoMock = { ID_PRODUCTOS: 3, Nombre: 'Filtro', Precio: '15', stock: 2 };

      Producto.findById.mockResolvedValue(productoMock);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Stock insuficiente para el producto Filtro. Stock actual: 2'
      });
      expect(DetalleOrdenServicio.create).not.toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe permitir la compra si el stock es exactamente igual a la cantidad', async () => {
      const bodyMock = { ID_PRODUCTOS: 3, cantidad: 5 };
      const productoMock = { ID_PRODUCTOS: 3, Nombre: 'Filtro', Precio: '15', stock: 5 };
      const nuevoDetalleMock = { id_detalle: 103 };

      Producto.findById.mockResolvedValue(productoMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(DetalleOrdenServicio.create).toHaveBeenCalled();
    });
  });

  describe('Saneamiento de campos', () => {
    test('Debe convertir ID_SERVICIOS vacío a null', async () => {
      const bodyMock = { ID_SERVICIOS: '', ID_PRODUCTOS: 3, cantidad: 1 };
      const productoMock = { ID_PRODUCTOS: 3, Nombre: 'Prod', Precio: '10', stock: 5 };
      const nuevoDetalleMock = { id_detalle: 104 };

      Producto.findById.mockResolvedValue(productoMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_SERVICIOS: null, // Saneado
          ID_PRODUCTOS: 3
        })
      );
    });

    test('Debe convertir ID_PRODUCTOS vacío a null', async () => {
      const bodyMock = { ID_SERVICIOS: 5, ID_PRODUCTOS: '', cantidad: 1 };
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const nuevoDetalleMock = { id_detalle: 105 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_SERVICIOS: 5,
          ID_PRODUCTOS: null // Saneado
        })
      );
    });

    test('Debe usar Garantia = 0 si no viene en el body', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 }; // Sin Garantia
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const nuevoDetalleMock = { id_detalle: 106 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({ Garantia: 0 })
      );
    });
  });

  describe('Fallbacks', () => {
    test('Debe usar cantidad = 1 si no se proporciona', async () => {
      const bodyMock = { ID_SERVICIOS: 5 }; // Sin cantidad
      const servicioMock = { ID_SERVICIOS: 5, Precio: '50' };
      const nuevoDetalleMock = { id_detalle: 107 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(DetalleOrdenServicio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cantidad: 1,
          precio_unitario: 50,
          subtotal: 50
        })
      );
    });

    test('Debe usar id_usuario = 1 por defecto si req.user no está presente', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 };
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const nuevoDetalleMock = { id_detalle: 108 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock }; // Sin req.user
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1, // Fallback
        'detalles_orden_servicio',
        108,
        'INSERT',
        expect.any(String)
      );
    });

    test('Debe usar "N/A" si no hay ID de orden en el body', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 }; // Sin ID_ORDEN_SERVICIO ni id_orden
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const nuevoDetalleMock = { id_detalle: 109 };

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,
        'detalles_orden_servicio',
        109,
        'INSERT',
        'Se agregó detalle a la orden N/A'
      );
    });

    test('Debe usar insertId si id_detalle no está presente en la respuesta', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 };
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const resultadoCreateMock = { insertId: 110, affectedRows: 1 }; // Sin id_detalle

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,
        'detalles_orden_servicio',
        110, // insertId
        'INSERT',
        expect.any(String)
      );
    });

    test('Debe usar 0 como último fallback del ID en logHistory', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 };
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const resultadoCreateMock = { affectedRows: 1 }; // Sin id_detalle ni insertId

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockResolvedValue(resultadoCreateMock);
      logHistory.mockResolvedValue();

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,
        'detalles_orden_servicio',
        0, // Último fallback
        'INSERT',
        expect.any(String)
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la búsqueda del servicio', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 };
      const dbError = new Error('Error al buscar servicio');

      Servicio.findById.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al buscar servicio'
      });
      expect(DetalleOrdenServicio.create).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la búsqueda del producto', async () => {
      const bodyMock = { ID_PRODUCTOS: 3, cantidad: 1 };
      const dbError = new Error('Error al buscar producto');

      Producto.findById.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al buscar producto'
      });
      expect(DetalleOrdenServicio.create).not.toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla la creación del detalle', async () => {
      const bodyMock = { ID_SERVICIOS: 5, cantidad: 1 };
      const servicioMock = { ID_SERVICIOS: 5, Precio: '20' };
      const dbError = new Error('Error al insertar detalle');

      Servicio.findById.mockResolvedValue(servicioMock);
      DetalleOrdenServicio.create.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al insertar detalle'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });

    test('Debe devolver 500 si falla el descuento de stock', async () => {
      const bodyMock = { ID_PRODUCTOS: 3, cantidad: 2 };
      const productoMock = { ID_PRODUCTOS: 3, Nombre: 'Prod', Precio: '10', stock: 10 };
      const nuevoDetalleMock = { id_detalle: 111 };
      const dbError = new Error('Error al descontar stock');

      Producto.findById.mockResolvedValue(productoMock);
      DetalleOrdenServicio.create.mockResolvedValue(nuevoDetalleMock);
      pool.query.mockRejectedValue(dbError);

      const req = { body: bodyMock, user: { id_usuario: 1 } };
      const res = mockRes();

      await crearDetalleOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al descontar stock'
      });
      expect(logHistory).not.toHaveBeenCalled();
    });
  });
});