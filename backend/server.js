import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileToPath, fileURLToPath } from "url";
import errorHandler from "./middleware/errorHandler.js"

dotenv.config();

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//routes
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    statusCode: 404,
  });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(
    `Example app listening on port ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

process.on("unhandledRejection", (err) => {
  console.error(`Error:${err.message}`);
  process.exit(1);
});



