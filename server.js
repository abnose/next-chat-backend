const express = require("express");
const { Server } = require("socket.io");
const port = process.env.PORT || 5000;
const app = express();
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let logedInUsers = [];

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    if (!socket.rooms.has(userId)) {
      socket.join(userId);
      if (!logedInUsers.includes(userId)) {
        logedInUsers.push(userId);
      }
    }

    console.log(logedInUsers);

    logedInUsers.forEach((user) => {
      // if (user !== userId) {
      io.to(user).emit("online-user-update", logedInUsers);
      // }
    });
  });

  socket.on("send-new-message", (message) => {
    message.chat.users.forEach((user) => {
      console.log(user._id);
      // if (user._id !== message.sender._id) {
      io.to(user._id).emit("new-message-received", message);
      // }
    });
    // socket.to(message.receiver).emit("new-message-receive", mess age);
  });

  socket.on("logout", (userId) => {
    socket.leave(userId);
    logedInUsers = logedInUsers.filter((user) => user !== userId);

    console.log(logedInUsers);

    logedInUsers.forEach((user) => {
      // if (user !== userId) {
      io.to(user).emit("online-user-update", logedInUsers);
      // }
    });
  });

  socket.on("typing", ({ chat, senderId }) => {
    chat.users.forEach((user) => {
      if (user._id !== senderId) {
        io.to(user._id).emit("typing", chat);
      }
    });
  });

  //   console.log("a user connected");
  //   socket.on("disconnect", () => {
  //     console.log("user disconnected");
  //   });
  //   socket.on("chat message", (msg) => {
  //     console.log("message: " + msg);
  //     io.emit("chat message", msg);
  //   });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});
