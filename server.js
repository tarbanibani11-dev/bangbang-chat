const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const onlineUsers = new Map();

function broadcastUserList() {
  const users = Array.from(onlineUsers.values());
  io.emit("user_list", users);
}

function getTime() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit"
  });
}

io.on("connection", (socket) => {
  socket.on("user_join", (username) => {
    const name = String(username).trim().slice(0, 30);
    if (!name) return;
    onlineUsers.set(socket.id, name);
    broadcastUserList();
    io.emit("system_message", { text: `${name} bergabung ke room`, time: getTime() });
  });

  socket.on("chat_message", ({ message }) => {
    const username = onlineUsers.get(socket.id);
    if (!username) return;
    io.emit("chat_message", {
      username,
      message: String(message).trim().slice(0, 1000),
      time: getTime(),
      id: socket.id
    });
  });

  socket.on("disconnect", () => {
    const username = onlineUsers.get(socket.id);
    if (username) {
      onlineUsers.delete(socket.id);
      broadcastUserList();
      io.emit("system_message", { text: `${username} meninggalkan room`, time: getTime() });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
