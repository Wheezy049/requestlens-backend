import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);

app.get("/", (req, res) => {
  res.send("PulseTrace API is running 🚀");
});

export default app;