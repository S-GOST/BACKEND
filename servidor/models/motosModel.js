import pool from "../config/db.js";
const Moto = {
    // Obtener todas las motos
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM motos");
        return rows;
    },

    // Buscar una moto por su Clave Primaria (ID)
    findByPk: async (id) => {
        const [rows] = await pool.query("SELECT * FROM motos WHERE ID_MOTOS = ?", [id]);
        return rows[0];
    },

    // Crear una nueva moto
    create: async (datos) => {
        // Extraer los campos (ajusta los nombres según tu tabla)
        const { ID_MOTOS, Placa, Marca, Modelo, Cilindraje, Color, ID_CLIENTE } = datos;
        
        const [result] = await pool.query(
            "INSERT INTO motos (ID_MOTOS, Placa, Marca, Modelo, Cilindraje, Color, ID_CLIENTE) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [ID_MOTOS, Placa, Marca, Modelo, Cilindraje, Color, ID_CLIENTE]
        );
        
        // Devolvemos el objeto creado. Si ID_MOTOS es AUTO_INCREMENT, usamos result.insertId
        return { 
            ID_MOTOS: ID_MOTOS || result.insertId, 
            Placa, 
            Marca, 
            Modelo, 
            Cilindraje, 
            Color, 
            ID_CLIENTE 
        };
    },

    // Actualizar una moto existente
    update: async (id, datos) => {
        const { Placa, Marca, Modelo, Cilindraje, Color, ID_CLIENTE } = datos;
        
        await pool.query(
            "UPDATE motos SET Placa = ?, Marca = ?, Modelo = ?, Cilindraje = ?, Color = ?, ID_CLIENTE = ? WHERE ID_MOTOS = ?",
            [Placa, Marca, Modelo, Cilindraje, Color, ID_CLIENTE, id]
        );
        
        // Devolvemos el objeto actualizado
        return { ID_MOTOS: id, Placa, Marca, Modelo, Cilindraje, Color, ID_CLIENTE };
    },

    // Eliminar una moto
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM motos WHERE ID_MOTOS = ?", [id]);
        return result;
    }
};

const motos = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM motos");
    return rows.map((row) => ({
      ...row,
      Recorrido: Number(row.Recorrido),
    }));
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM motos WHERE ID_MOTOS = ?",
      [id]
    );
    if (!rows.length) return null;
    return {
      ...rows[0],
      Recorrido: Number(rows[0].Recorrido),
    };
  },

  create: async (data) => {
    const { ID_MOTOS, ID_CLIENTES, Placa, Modelo, Marca, Recorrido } = data;
    const [result] = await pool.query(
      `INSERT INTO motos (ID_MOTOS, ID_CLIENTES, Placa, Modelo, Marca, Recorrido)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ID_MOTOS, ID_CLIENTES, Placa, Modelo, Marca, Recorrido]
    );
    return result;
  },

  update: async (id, data) => {
    const { ID_MOTOS, ID_CLIENTES, Placa, Modelo, Marca, Recorrido } = data;
    const [result] = await pool.query(
      `UPDATE motos
       SET ID_MOTOS = ?, ID_CLIENTES = ?, Placa = ?, Modelo = ?, Marca = ?, Recorrido = ?
       WHERE ID_MOTOS = ?`,
      [ID_MOTOS, ID_CLIENTES, Placa, Modelo, Marca, Recorrido, id]
    );
    return result;
  },

  delete: async (id) => {
    await pool.query("DELETE FROM motos WHERE ID_MOTOS = ?", [id]);
    return true;
  },
};

export default motos;
