import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import db from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

db();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Normalize URL in case Vercel rewrites prepend /api/index.js
app.use((req, res, next) => {
  if (req.url.startsWith("/api/index.js")) {
    req.url = req.url.replace(/^\/api\/index\.js/, "") || "/";
  }
  next();
});

// Health check routes (immediate response for diagnostics)
app.get(["/", "/api", "/api/index.js"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "LearniX AI Learning Assistant API is running",
    dbConnected: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.status(200).json({
    status: "ok",
    database: dbStatusMap[dbState] || "unknown",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Serverless DB connection middleware
app.use(async (req, res, next) => {
  try {
    await db();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
  }
  next();
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    statusCode: 404,
  });
});

const port = process.env.PORT || 8000;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(
      `LearniX server running in ${process.env.NODE_ENV || "development"} mode on port ${port}`
    );
  });
}

process.on("unhandledRejection", (err) => {
  console.error(`Error:${err.message}`);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

export default app;
