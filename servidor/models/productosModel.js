import pool from "../config/db.js";

const Producto = {
  // 1. Obtener todos los productos (con JOIN a categorias)
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre 
       FROM productos p 
       LEFT JOIN categorias c ON p.ID_CATEGORIA = c.ID_CATEGORIA`
    );
    return rows;
  },

  // 2. Buscar un producto por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre 
       FROM productos p 
       LEFT JOIN categorias c ON p.ID_CATEGORIA = c.ID_CATEGORIA 
       WHERE p.ID_PRODUCTOS = ?`,
      [id]
    );
    return rows[0];
  },

  // 3. Buscar productos por categoría
  findByCategoria: async (idCategoria) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre 
       FROM productos p 
       LEFT JOIN categorias c ON p.ID_CATEGORIA = c.ID_CATEGORIA 
       WHERE p.ID_CATEGORIA = ?`,
      [idCategoria]
    );
    return rows;
  },

  // 4. Crear un nuevo producto
  create: async (data) => {
    const {
      ID_PRODUCTOS,
      ID_CATEGORIA,
      Marca,
      Nombre,
      Precio,
      stock,
      Estado,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO productos 
       (ID_PRODUCTOS, ID_CATEGORIA, Marca, Nombre, Precio, stock, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_PRODUCTOS, ID_CATEGORIA, Marca, Nombre, Precio, stock || 0, Estado]
    );

    return result;
  },

  // 5. Actualizar un producto existente
  update: async (id, data) => {
    const {
      ID_PRODUCTOS,
      ID_CATEGORIA,
      Marca,
      Nombre,
      Precio,
      stock,
      Estado,
    } = data;

    const [result] = await pool.query(
      `UPDATE productos 
       SET ID_PRODUCTOS = ?, ID_CATEGORIA = ?, Marca = ?, Nombre = ?,
           Precio = ?, stock = ?, Estado = ?
       WHERE ID_PRODUCTOS = ?`,
      [ID_PRODUCTOS, ID_CATEGORIA, Marca, Nombre, Precio, stock !== undefined ? stock : 0, Estado, id]
    );

    return result;
  },

  // 6. Eliminar un producto (ahora es inhabilitar)
  delete: async (id) => {
    await pool.query("UPDATE productos SET Estado = 'Inactivo' WHERE ID_PRODUCTOS = ?", [id]);
    return true;
  },

  // 7. Restaurar (Habilitar) un producto
  restore: async (id) => {
    const [result] = await pool.query("UPDATE productos SET Estado = 'Activo' WHERE ID_PRODUCTOS = ?", [id]);
    return result;
  },
};

export default Producto;