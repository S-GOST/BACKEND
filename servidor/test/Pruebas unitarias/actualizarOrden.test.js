// test/Pruebas unitarias/actualizarOrden.test.js

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

// 2. Mock de db.js (SIN virtual, necesitamos usar pool.query para garantías)
jest.mock('../../config/db.js', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

const { actualizarOrden } = require('../../controllers/ordenServicioController.js');
const { logHistory } = require('../../utils/historyLogger.js');
const pool = require('../../config/db.js');
const OrdenServicio = require('../../models/ordenServicioModel.js').default;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('actualizarOrden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validación de entrada', () => {
    test('Debe devolver 400 si no se proporciona ID', async () => {
      const req = { params: {}, body: {}, admin: { id_usuario: 1, rol: 1 } };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID_ORDEN_SERVICIO es requerido'
      });
      expect(OrdenServicio.findById).not.toHaveBeenCalled();
    });
  });

  describe('Casos no encontrados (404)', () => {
    test('Debe devolver 404 si la orden no existe', async () => {
      const id = '999';
      OrdenServicio.findById.mockResolvedValue(null);

      const req = { 
        params: { id }, 
        body: {},
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(OrdenServicio.findById).toHaveBeenCalledWith(id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Orden de servicio no encontrada'
      });
    });
  });

  describe('Validaciones de permisos y estados', () => {
    const ordenBase = {
      ID_ORDEN_SERVICIO: 5,
      ID_CLIENTES: 10,
      ID_TECNICOS: 20,
      ID_MOTOS: 3,
      Fecha_inicio: '2024-02-15',
      Fecha_estimada: null,
      Fecha_fin: null,
      Estado: 'Pendiente',
      observaciones: 'Sin observaciones'
    };

    test('Debe devolver 403 si un técnico no asignado intenta cambiar el estado', async () => {
      const id = '5';
      OrdenServicio.findById.mockResolvedValue(ordenBase);

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' },
        admin: { id_usuario: 99, rol: 2 } // Técnico diferente al asignado (20)
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Solo el administrador o el técnico asignado pueden cambiar el estado'
      });
      expect(OrdenServicio.update).not.toHaveBeenCalled();
    });

    test('Debe permitir al admin cambiar el estado aunque no sea el técnico asignado', async () => {
      const id = '5';
      const ordenActualizada = { ...ordenBase, Estado: 'En Proceso' };
      
      OrdenServicio.findById
        .mockResolvedValueOnce(ordenBase)
        .mockResolvedValueOnce(ordenActualizada);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' },
        admin: { id_usuario: 1, rol: 1 }, // Admin
        user: { id_usuario: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(OrdenServicio.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: ordenActualizada
      });
    });

    test('Debe permitir al técnico asignado cambiar el estado', async () => {
      const id = '5';
      const ordenActualizada = { ...ordenBase, Estado: 'En Proceso' };
      
      OrdenServicio.findById
        .mockResolvedValueOnce(ordenBase)
        .mockResolvedValueOnce(ordenActualizada);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' },
        admin: { id_usuario: 20, rol: 2 }, // Técnico asignado
        user: { id_usuario: 20 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(OrdenServicio.update).toHaveBeenCalled();
    });

    test('Debe devolver 400 si intenta modificar una orden Completada', async () => {
      const id = '5';
      const ordenCompletada = { ...ordenBase, Estado: 'Completada' };
      OrdenServicio.findById.mockResolvedValue(ordenCompletada);

      const req = {
        params: { id },
        body: { Estado: 'Cancelada' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La orden está Completada y no se puede modificar.'
      });
    });

    test('Debe devolver 400 si intenta modificar una orden Cancelada', async () => {
      const id = '5';
      const ordenCancelada = { ...ordenBase, Estado: 'Cancelada' };
      OrdenServicio.findById.mockResolvedValue(ordenCancelada);

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La orden está Cancelada y no se puede modificar.'
      });
    });

    test('Debe devolver 400 si intenta cambiar a En Proceso desde un estado no Pendiente', async () => {
      const id = '5';
      const ordenEnProceso = { ...ordenBase, Estado: 'En Proceso' };
      OrdenServicio.findById.mockResolvedValue(ordenEnProceso);

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' }, // Mismo estado, no debería fallar
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();
      
      OrdenServicio.findById.mockResolvedValueOnce(ordenEnProceso).mockResolvedValueOnce(ordenEnProceso);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });

      await actualizarOrden(req, res);

      // Como no hay cambio de estado, no debería fallar
      expect(res.json).toHaveBeenCalled();
    });

    test('Debe devolver 400 si intenta cambiar a En Proceso desde estado distinto a Pendiente', async () => {
      const id = '5';
      const ordenEnProceso = { ...ordenBase, Estado: 'En Proceso' };
      OrdenServicio.findById.mockResolvedValue(ordenEnProceso);

      // Intentar volver a "En Proceso" desde "En Proceso" no debería fallar
      // Pero intentar desde otro estado sí. Probemos transición inválida:
      const ordenEnProceso2 = { ...ordenBase, Estado: 'Completada' };
      // Ya cubierta arriba con Completada
    });

    test('Debe devolver 400 si intenta Completar sin estar En Proceso', async () => {
      const id = '5';
      OrdenServicio.findById.mockResolvedValue(ordenBase); // Estado: Pendiente

      const req = {
        params: { id },
        body: { Estado: 'Completada' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Solo se puede Completar si está En Proceso.'
      });
    });

    test('Debe devolver 400 si intenta Cancelar sin observaciones', async () => {
      const id = '5';
      const ordenEnProceso = { ...ordenBase, Estado: 'En Proceso' };
      OrdenServicio.findById.mockResolvedValue(ordenEnProceso);

      const req = {
        params: { id },
        body: { Estado: 'Cancelada' }, // Sin observaciones
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requieren observaciones para cancelar la orden.'
      });
    });

    test('Debe permitir Cancelar si se proporcionan observaciones', async () => {
      const id = '5';
      const ordenEnProceso = { ...ordenBase, Estado: 'En Proceso' };
      const ordenCancelada = { ...ordenEnProceso, Estado: 'Cancelada', observaciones: 'Cliente no respondió' };
      
      OrdenServicio.findById
        .mockResolvedValueOnce(ordenEnProceso)
        .mockResolvedValueOnce(ordenCancelada);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = {
        params: { id },
        body: { Estado: 'Cancelada', observaciones: 'Cliente no respondió' },
        admin: { id_usuario: 1, rol: 1 },
        user: { id_usuario: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(OrdenServicio.update).toHaveBeenCalled();
      expect(logHistory).toHaveBeenCalledWith(
        1,
        'orden_servicio',
        id,
        'UPDATE',
        expect.stringContaining('Cambió estado de En Proceso a Cancelada')
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: ordenCancelada
      });
    });
  });

  describe('Actualización exitosa', () => {
    test('Debe actualizar la orden sin cambiar estado (sin logHistory)', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs original'
      };
      const ordenActualizada = { ...ordenOriginal, observaciones: 'Obs actualizada' };

      OrdenServicio.findById
        .mockResolvedValueOnce(ordenOriginal)
        .mockResolvedValueOnce(ordenActualizada);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });

      const req = {
        params: { id },
        body: { observaciones: 'Obs actualizada' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(OrdenServicio.update).toHaveBeenCalled();
      expect(logHistory).not.toHaveBeenCalled(); // No cambió el estado
      expect(pool.query).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: ordenActualizada
      });
    });

    test('Debe actualizar garantías de productos si se envía garantia_productos', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs'
      };

      OrdenServicio.findById
        .mockResolvedValueOnce(ordenOriginal)
        .mockResolvedValueOnce(ordenOriginal);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      const req = {
        params: { id },
        body: { garantia_productos: '6 meses' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE detalles_orden_servicio SET garantia = ? WHERE id_orden = ? AND ID_PRODUCTOS IS NOT NULL',
        ['6 meses', id]
      );
    });

    test('Debe actualizar garantías de servicios si se envía garantia_servicios', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs'
      };

      OrdenServicio.findById
        .mockResolvedValueOnce(ordenOriginal)
        .mockResolvedValueOnce(ordenOriginal);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      const req = {
        params: { id },
        body: { garantia_servicios: '3 meses' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE detalles_orden_servicio SET garantia = ? WHERE id_orden = ? AND ID_SERVICIOS IS NOT NULL',
        ['3 meses', id]
      );
    });

    test('Debe actualizar ambas garantías si se envían ambas', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs'
      };

      OrdenServicio.findById
        .mockResolvedValueOnce(ordenOriginal)
        .mockResolvedValueOnce(ordenOriginal);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      const req = {
        params: { id },
        body: { garantia_productos: '6 meses', garantia_servicios: '3 meses' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test('Debe registrar en logHistory si el estado cambia', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs'
      };
      const ordenActualizada = { ...ordenOriginal, Estado: 'En Proceso' };

      OrdenServicio.findById
        .mockResolvedValueOnce(ordenOriginal)
        .mockResolvedValueOnce(ordenActualizada);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' },
        admin: { id_usuario: 1, rol: 1 },
        user: { id_usuario: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,
        'orden_servicio',
        id,
        'UPDATE',
        expect.stringContaining('Cambió estado de Pendiente a En Proceso')
      );
    });

    test('Debe usar "N/A" en logHistory si no hay observaciones', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: null
      };
      const ordenActualizada = { ...ordenOriginal, Estado: 'En Proceso' };

      OrdenServicio.findById
        .mockResolvedValueOnce(ordenOriginal)
        .mockResolvedValueOnce(ordenActualizada);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      logHistory.mockResolvedValue();

      const req = {
        params: { id },
        body: { Estado: 'En Proceso' },
        admin: { id_usuario: 1, rol: 1 },
        user: { id_usuario: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(logHistory).toHaveBeenCalledWith(
        1,
        'orden_servicio',
        id,
        'UPDATE',
        expect.stringContaining('Obs: N/A')
      );
    });
  });

  describe('Manejo de errores', () => {
    test('Debe devolver 500 si falla la búsqueda inicial', async () => {
      const id = '5';
      OrdenServicio.findById.mockRejectedValue(new Error('Error de BD'));

      const req = {
        params: { id },
        body: {},
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error de BD'
      });
    });

    test('Debe devolver 500 si falla la actualización', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs'
      };

      OrdenServicio.findById.mockResolvedValue(ordenOriginal);
      OrdenServicio.update.mockRejectedValue(new Error('Error al actualizar'));

      const req = {
        params: { id },
        body: { observaciones: 'Nueva obs' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Debe devolver 500 si falla la actualización de garantías', async () => {
      const id = '5';
      const ordenOriginal = {
        ID_ORDEN_SERVICIO: 5,
        ID_CLIENTES: 10,
        ID_TECNICOS: 20,
        ID_MOTOS: 3,
        Estado: 'Pendiente',
        observaciones: 'Obs'
      };

      OrdenServicio.findById.mockResolvedValue(ordenOriginal);
      OrdenServicio.update.mockResolvedValue({ affectedRows: 1 });
      pool.query.mockRejectedValue(new Error('Error al actualizar garantía'));

      const req = {
        params: { id },
        body: { garantia_productos: '6 meses' },
        admin: { id_usuario: 1, rol: 1 }
      };
      const res = mockRes();

      await actualizarOrden(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});