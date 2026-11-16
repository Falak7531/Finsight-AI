import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Insight AI API",
      version: "1.0.0",
      description: "API documentation for the Insight AI backend.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: "Local development server",
      },
    ],
    components: {
      schemas: {
        SignupRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "Falak",
            },
            email: {
              type: "string",
              format: "email",
              example: "falak@example.com",
            },
            password: {
              type: "string",
              example: "hello123",
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      requestSnippetsEnabled: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    })
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;
