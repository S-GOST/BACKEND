import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API S-GOST",
      version: "1.0.0",
      description: "Documentación de la API s-gost",
    },
    servers: [
      {
        url: "https://backend-nube-gzq9.onrender.com",
        description: "Servidor Producción (Render)"
      },
      {
        url: "http://localhost:3000",
        description: "Servidor Local"
      }
    ],
    // --- ESTE ES EL COMPONENTE DE SEGURIDAD ---
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    // Esto aplica la seguridad a nivel global (opcional)
    // security: [{ bearerAuth: [] }], 
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
