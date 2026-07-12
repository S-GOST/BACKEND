import pool from "../config/db.js";

const motos = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM motos");
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM motos WHERE id_moto = ?",
      [id]
    );
    if (!rows.length) return null;
    return rows[0];
  },

  create: async (data) => {
    // Aceptamos las keys en camelCase, PascalCase o los nombres de las columnas reales
    const finalIdCliente = data.id_cliente || data.ID_CLIENTES || data.ID_CLIENTE;
    const finalPlaca = data.placa || data.Placa;
    const finalMarca = data.marca || data.Marca;
    const finalModelo = data.modelo || data.Modelo;
    const finalCilindraje = data.cilindraje || data.Cilindraje || null;
    const finalKilometraje = data.kilometraje || data.Kilometraje || data.Recorrido || 0;

    const [result] = await pool.query(
      `INSERT INTO motos (id_cliente, placa, marca, modelo, cilindraje, kilometraje)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [finalIdCliente, finalPlaca, finalMarca, finalModelo, finalCilindraje, finalKilometraje]
    );
    
    return {
      id_moto: result.insertId,
      id_cliente: finalIdCliente,
      placa: finalPlaca,
      marca: finalMarca,
      modelo: finalModelo,
      cilindraje: finalCilindraje,
      kilometraje: finalKilometraje
    };
  },

  update: async (id, data) => {
    const finalIdCliente = data.id_cliente || data.ID_CLIENTES || data.ID_CLIENTE;
    const finalPlaca = data.placa || data.Placa;
    const finalMarca = data.marca || data.Marca;
    const finalModelo = data.modelo || data.Modelo;
    const finalCilindraje = data.cilindraje || data.Cilindraje || null;
    const finalKilometraje = data.kilometraje || data.Kilometraje || data.Recorrido || 0;

    const [result] = await pool.query(
      `UPDATE motos
       SET id_cliente = ?, placa = ?, marca = ?, modelo = ?, cilindraje = ?, kilometraje = ?
       WHERE id_moto = ?`,
      [finalIdCliente, finalPlaca, finalMarca, finalModelo, finalCilindraje, finalKilometraje, id]
    );
    return result;
  },

  delete: async (id) => {
    await pool.query("DELETE FROM motos WHERE id_moto = ?", [id]);
    return true;
  }
};

export default motos;
