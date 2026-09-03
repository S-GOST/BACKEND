import prisma from '../config/prisma.js';

const motos = {
  // Obtener todas las motos
  findAll: async () => {
    return await prisma.motos.findMany();
  },

  // Buscar por ID
  findById: async (id) => {
    return await prisma.motos.findUnique({
      where: { id_moto: Number(id) }
    });
  },

  // Crear una nueva moto
  create: async (data) => {
    // Aceptamos las keys en camelCase, PascalCase o los nombres de las columnas reales
    const finalIdCliente = data.id_cliente || data.ID_CLIENTES || data.ID_CLIENTE;
    const finalPlaca = data.placa || data.Placa;
    const finalMarca = data.marca || data.Marca;
    const finalModelo = data.modelo || data.Modelo;
    const finalCilindraje = data.cilindraje || data.Cilindraje || null;
    const finalKilometraje = data.kilometraje || data.Kilometraje || data.Recorrido || 0;

    return await prisma.motos.create({
      data: {
        id_cliente: Number(finalIdCliente),
        placa: finalPlaca,
        marca: finalMarca,
        modelo: finalModelo,
        cilindraje: finalCilindraje ? Number(finalCilindraje) : null,
        kilometraje: finalKilometraje ? Number(finalKilometraje) : 0
      }
    });
  },

  // Actualizar moto
  update: async (id, data) => {
    // Extraemos las keys tolerando diferentes formatos
    const finalIdCliente = data.id_cliente || data.ID_CLIENTES || data.ID_CLIENTE;
    const finalPlaca = data.placa || data.Placa;
    const finalMarca = data.marca || data.Marca;
    const finalModelo = data.modelo || data.Modelo;
    const finalCilindraje = data.cilindraje || data.Cilindraje || null;
    const finalKilometraje = data.kilometraje || data.Kilometraje || data.Recorrido || 0;

    return await prisma.motos.update({
      where: { id_moto: Number(id) },
      data: {
        id_cliente: finalIdCliente ? Number(finalIdCliente) : undefined,
        placa: finalPlaca,
        marca: finalMarca,
        modelo: finalModelo,
        cilindraje: finalCilindraje ? Number(finalCilindraje) : null,
        kilometraje: finalKilometraje ? Number(finalKilometraje) : 0
      }
    });
  },

  // Eliminar moto
  delete: async (id) => {
    return await prisma.motos.delete({
      where: { id_moto: Number(id) }
    });
  }
};

export default motos;
