import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { notesRouter } from "./routes/notes.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/admin", adminRouter);

app.use((request, response) => {
  response.status(404).json({ error: "Not found." });
});

app.use((error, _request, response, _next) => {
  if (error?.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Invalid JSON body." });
  }

  console.error(error);
  return response.status(500).json({
    error: "Something went wrong.",
    detail: error?.message,
  });
});
