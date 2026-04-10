import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API S-GOST",
      version: "1.0.0",
      description: "Documentación de la APIS s-gost",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.js"], // 👈 Aquí están tus rutas
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;