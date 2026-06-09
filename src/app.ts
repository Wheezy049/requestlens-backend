import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import endpointRouter from "./routes/endpoint.routes.js";
import logRouter from "./routes/logs.routes.js";
import statsRouter from "./routes/stats.routes.js";
import { monitorMiddleware } from "./middlewares/monitor.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.join(__dirname, "../swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(monitorMiddleware);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects", endpointRouter);
app.use("/api/projects", statsRouter);
app.use("/api/logs", logRouter);

app.get("/", (req, res) => {
  res.send("PulseTrace API is running 🚀");
});

export default app;