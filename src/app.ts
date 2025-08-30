import cors from "cors";
import path from "path";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import notFound from "./app/middlewares/notFound";
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";

// Import WebSocket initializer
import initWebSocket from "./app/helpers/chat";
import http from "http";

const app: Application = express();

// Parsers
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

// App routes
app.use("/api/v1", router);

app.get("/", async (req: Request, res: Response) => {
  res.render("index.ejs");
});

app.use(globalErrorHandler);
app.use(notFound);

// --- Create HTTP server and attach WebSocket ---
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

// Export server instead of app
export default server;
