import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import http, { get } from "http";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL!, // OR: ['http://localhost:5173', 'https://yourdomain.com']
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL!,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

httpServer.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

const userMap = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("user-joined", ({ userId }) => {
    userMap.set(socket.id, userId);
    console.log(`${userId} joined`);

    socket.broadcast.emit("user-connected", { userId });
  });

  socket.on("chat-message", async (msg) => {
    console.log("Received: ", msg);
    const message = await fetch(`${process.env.CLIENT_URL}/api/send-message`, {
      method: "POST",
      body: JSON.stringify(msg),
      headers: { "content-type": "application/json" },
    });
    console.log("result", message);
    io.emit("chat-message", await message.json());
  });

  socket.on("typing", ({ userId }) => {
    console.log(`User ${userId} is typing`);
    io.emit("user-typing", userId);
  });

  socket.on("stop-typing", ({ userId }) => {
    console.log(`User ${userId} has stopped typing`);
    io.emit("user-stop-typing", userId);
  });

  socket.on("disconnect", async () => {
    const userId = userMap.get(socket.id);
    if (userId) {
      console.log(`${userId} disconnected`);
      socket.broadcast.emit("user-disconnected", {
        userId,
        lastSeen: new Date(),
      });
      await fetch(`${process.env.CLIENT_URL}/api/change-state/offline`, {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: { "content-type": "application/json" },
      });
      userMap.delete(socket.id);
    }
  });
});
