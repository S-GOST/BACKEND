import pool from "../config/db.js";

const Producto = {
  // 1. Obtener todos los productos
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM productos");
    return rows;
  },

  // 2. Buscar un producto por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE ID_PRODUCTOS = ?",
      [id]
    );
    return rows[0];
  },
    // Dentro del objeto Producto, añade:
    findLowStock: async (umbral) => {
        const [rows] = await pool.query(
            "SELECT * FROM productos WHERE CANTIDAD < ?",
            [umbral]
        );
        return rows;
    },
  // 3. Crear un nuevo producto
  create: async (data) => {
    const {
      ID_PRODUCTOS,
      Categoria,
      Marca,
      Nombre,
      Garantia,
      Precio,
      Cantidad,
      Estado,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO productos 
       (ID_PRODUCTOS, Categoria, Marca, Nombre, Garantia, Precio, Cantidad,Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_PRODUCTOS, Categoria, Marca, Nombre, Garantia, Precio, Cantidad, Estado]
    );

    return result;
  },

  // 4. Actualizar un producto existente
  update: async (id, data) => {
    const {
      ID_PRODUCTOS,
      Categoria,
      Marca,
      Nombre,
      Garantia,
      Precio,
      Cantidad,
      Estado,
    } = data;

    const [result] = await pool.query(
      `UPDATE productos 
       SET ID_PRODUCTOS = ?, Categoria = ?, Marca = ?, Nombre = ?,
           Garantia = ?, Precio = ?, Cantidad = ?, Estado = ?
       WHERE ID_PRODUCTOS = ?`,
      [ID_PRODUCTOS, Categoria, Marca, Nombre, Garantia, Precio, Cantidad, Estado, id]
    );

    return result;
  },

  // 5. Eliminar un producto
  delete: async (id) => {
    await pool.query("DELETE FROM productos WHERE ID_PRODUCTOS = ?", [id]);
    return true;
  },
};

export default Producto;