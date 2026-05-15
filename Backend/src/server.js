import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import connectDB from "./common/config/db.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import cookieParser from "cookie-parser";
import pollRoutes, { publicPollRoutes } from "./modules/Poll/poll.routes.js";
import userRoutes from "./modules/User/user.routes.js";

dotenv.config();

await connectDB();

const app = express();
const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

//socket.io server setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});
//cookie parser
app.use(cookieParser());

//security
app.use(helmet());

//cross platform verification
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));

//for understanding the req = method and path (for the understanding not for production) dev use
// app.use((req, res, next) => {
//   console.log(`${req.method} - ${req.path}`);
//   next();
// });

app.use((req, res, next) => {
  req.io = io;
  next();
});

//server health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

//api routes
app.use("/api/users", userRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/public/polls", publicPollRoutes);

//socket connection
io.on("connection", (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);

  socket.on("join_poll", (pollToken) => {
    socket.join(`poll-${pollToken}`);
    console.log(`User joined poll: ${pollToken}`);
  });

  socket.on("leave_poll", (pollToken) => {
    socket.leave(`poll-${pollToken}`);
    console.log(`User left poll: ${pollToken}`);
  });

  socket.on("disconnect", () => {
    console.log(`WebSocket disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`Socket error: ${error}`);
  });
});

//error handlers
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("POLL PLATFORM SERVER Running...");
  console.log(`Port: ${PORT}`);
  console.log(`URL: ${process.env.SERVER_URL || `http://localhost:${PORT}`}`);
  console.log("========================================");
  console.log("");
});
