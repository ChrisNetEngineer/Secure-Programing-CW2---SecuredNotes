import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: config.frontendOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.use((request, response) => {
  response.status(404).json({ error: "Not found." });
});

app.use((error, _request, response, _next) => {
  if (error?.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Invalid JSON body." });
  }

  console.error(error);
  return response.status(500).json({ error: "Something went wrong." });
});
