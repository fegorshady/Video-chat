const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors"); // Import cors

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors()); // Enable CORS for all routes

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on("offer", (data) => {
    socket.to(data.room).emit("offer", data.offer);
    console.log(`Sent offer to room ${data.room}`);
  });

  socket.on("answer", (data) => {
    socket.to(data.room).emit("answer", data.answer);
    console.log(`Sent answer to room ${data.room}`);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.room).emit("ice-candidate", data.candidate);
    console.log(`Sent ICE candidate to room ${data.room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 4001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
