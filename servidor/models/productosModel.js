import prisma from '../config/prisma.js';

// Función ayudante para formatear el resultado igual que tu SQL antiguo
const formatProducto = (producto) => {
  if (!producto) return null;
  return {
    ...producto,
    categoria_nombre: producto.categorias ? producto.categorias.nombre : null,
    // Eliminamos el objeto anidado para mantener la respuesta limpia
    categorias: undefined
  };
};

const Producto = {
  // 1. Obtener todos los productos (con JOIN a categorias)
  findAll: async () => {
    const productos = await prisma.productos.findMany({
      include: {
        categorias: true
      }
    });
    return productos.map(formatProducto);
  },

  // 2. Buscar un producto por su ID
  findById: async (id) => {
    const producto = await prisma.productos.findUnique({
      where: { ID_PRODUCTOS: Number(id) },
      include: {
        categorias: true
      }
    });
    return formatProducto(producto);
  },

  // 3. Buscar productos por categoría
  findByCategoria: async (idCategoria) => {
    const productos = await prisma.productos.findMany({
      where: { ID_CATEGORIA: Number(idCategoria) },
      include: {
        categorias: true
      }
    });
    return productos.map(formatProducto);
  },

  // 4. Crear un nuevo producto
  create: async (data) => {
    return await prisma.productos.create({
      data: {
        ID_PRODUCTOS: data.ID_PRODUCTOS ? Number(data.ID_PRODUCTOS) : undefined,
        ID_CATEGORIA: Number(data.ID_CATEGORIA),
        Marca: data.Marca,
        Nombre: data.Nombre,
        precio_venta: data.precio_venta,
        precio_costo: data.precio_costo !== undefined ? data.precio_costo : 0,
        stock: data.stock !== undefined ? Number(data.stock) : 0,
        stock_minimo: data.stock_minimo !== undefined ? Number(data.stock_minimo) : 0,
        Estado: data.Estado || 'Activo',
      }
    });
  },

  // 5. Actualizar un producto existente
  update: async (id, data) => {
    return await prisma.productos.update({
      where: { ID_PRODUCTOS: Number(id) },
      data: {
        // En un update a veces no se manda el ID_PRODUCTOS, actualizamos el resto
        ID_CATEGORIA: data.ID_CATEGORIA ? Number(data.ID_CATEGORIA) : undefined,
        Marca: data.Marca,
        Nombre: data.Nombre,
        precio_venta: data.precio_venta,
        precio_costo: data.precio_costo,
        stock: data.stock !== undefined ? Number(data.stock) : undefined,
        stock_minimo: data.stock_minimo !== undefined ? Number(data.stock_minimo) : undefined,
        Estado: data.Estado,
      }
    });
  },

  // 6. Eliminar un producto (ahora es inhabilitar - Soft Delete)
  delete: async (id) => {
    return await prisma.productos.update({
      where: { ID_PRODUCTOS: Number(id) },
      data: { Estado: 'Inactivo' }
    });
  },

  // 7. Restaurar (Habilitar) un producto
  restore: async (id) => {
    return await prisma.productos.update({
      where: { ID_PRODUCTOS: Number(id) },
      data: { Estado: 'Activo' }
    });
  }
};

export default Producto;
