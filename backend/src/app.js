import express from "express";

import authRoutes from "./routes/auth.routes.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

// Allows Express to read JSON request bodies
app.use(express.json());

// Register Swagger docs
setupSwagger(app);

// Register auth routes
app.use("/api/auth", authRoutes);

export default app;

