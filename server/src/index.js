import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import initCanvasSocket from "./realtime/canvas.socket.js";

connectDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST"]
  }
});

initCanvasSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});