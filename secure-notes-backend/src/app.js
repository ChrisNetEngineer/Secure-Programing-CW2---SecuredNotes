import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { notesRouter } from "./routes/notes.js";
import { auditApiRequests } from "./middleware/auditRequest.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);
app.use(
  cors({
    origin: config.frontendOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "32kb" }));
app.use(auditApiRequests);

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
  return response.status(500).json({ error: "Something went wrong." });
});
