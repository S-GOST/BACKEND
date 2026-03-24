import pool from "../config/db.js"; // Importamos el pool de conexiones para interactuar con la base de datos.

const Producto = { 
  // 1. Obtener todos los productos
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM productos");
    return rows;
  },

  // 2. Buscar un producto por su ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE ID_PRODUCTO = ?",
      [id]
    );
    return rows[0];
  },

  // 3. Crear un nuevo producto
  create: async (data) => {
    const { 
      ID_PRODUCTO, 
      Nombre, 
      Descripcion, 
      Precio, 
      Stock, 
      Categoria, 
      ImagenURL 
    } = data;

    const [result] = await pool.query(
      `INSERT INTO productos
      (ID_PRODUCTO, Nombre, Descripcion, Precio, Stock, Categoria, ImagenURL)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_PRODUCTO, Nombre, Descripcion, Precio, Stock, Categoria, ImagenURL]
    );

    return result;
  },

  // 4. Actualizar un producto existente
  update: async (id, data) => {
    const { 
      ID_PRODUCTO, 
      Nombre, 
      Descripcion, 
      Precio, 
      Stock, 
      Categoria, 
    } = data;

    const [result] = await pool.query(
      `UPDATE productos 
       SET ID_PRODUCTO = ?, Nombre = ?, Descripcion = ?, Precio = ?, 
           Stock = ?, Categoria = ?, ImagenURL = ?
       WHERE ID_PRODUCTO = ?`,
      [ID_PRODUCTO, Nombre, Descripcion, Precio, Stock, Categoria, ImagenURL, id]
    );

    return result;
  },

  // 5. Eliminar un producto
  delete: async (id) => {
    await pool.query(
      "DELETE FROM productos WHERE ID_PRODUCTO = ?",
      [id]
    );
    return true;
  }
};

export default Producto;