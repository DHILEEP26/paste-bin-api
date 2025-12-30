import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import morgan from "morgan";

// Import routes
import pasteRoutes from "./routes/pasteRoute";

import viewPasteRoutes from "./routes/pasteViewRoute";

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Prevent parameter pollution
app.use(hpp());

// Logger
app.use(morgan("dev"));

// Body parser
app.use(express.json());

// Health check route
app.get("/api/healthz", async (req, res) => {
  try {
    // Try to access the database to check persistence layer
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(200).json({ ok: false });
  }
});

// Routes
app.use("/api/pastes", pasteRoutes);
app.use("/p", viewPasteRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Pastebin-Lite API is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message,
  });
});

export default app;