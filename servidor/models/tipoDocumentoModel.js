import prisma from '../config/prisma.js';

const TipoDocumento = {
  // Obtener todos los tipos de documento
  findAll: async () => {
    return await prisma.tipo_documento.findMany();
  },

  // Buscar por ID
  findById: async (id) => {
    return await prisma.tipo_documento.findUnique({
      where: {
        // Convertimos a número por si llega como string desde req.params
        id_tipo_documento: Number(id)
      }
    });
  }
};

export default TipoDocumento;
