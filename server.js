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

    logedInUsers.forEach((user) => {
      // if (user !== userId) {
      io.to(user).emit("online-user-update", logedInUsers);
      // }
    });
  });

  socket.on("send-new-message", (message) => {
    message.chat.users.forEach((user) => {
      let isLogged = false;
      let newMessage = { ...message };
      if (message?.isLogged) {
        isLogged = true;
        const removed = message?.chat?.users?.filter(
          (user) => message?.sender?._id != user._id
        );
        newMessage.chat.users = removed;
      }

      // if (user._id !== message.sender._id) {
      io.to(user._id).emit(
        "new-message-received",
        isLogged ? newMessage : message
      );
      // }
    });
    // socket.to(message.receiver).emit("new-message-receive", mess age);
  });

  socket.on("logout", (userId) => {
    socket.leave(userId);
    logedInUsers = logedInUsers.filter((user) => user !== userId);

    logedInUsers.forEach((user) => {
      // if (user !== userId) {
      io.to(user).emit("online-user-update", logedInUsers);
      // }
    });
  });

  socket.on("read-all-messages", ({ chatId, readByUserId, users }) => {
    users.forEach((user) => {
      // if (user._id !== readByUserId) {
      io.to(user).emit("user-read-all-chat-messages", { chatId, readByUserId });
      // }
    });
  });

  socket.on("typing", ({ chat, senderId, senderName }) => {
    chat.users.forEach((user) => {
      if (user._id !== senderId) {
        io.to(user._id).emit("typing", { chat, senderName });
      }
    });
  });

  socket.on("user-leave", ({ chat, user }) => {
    io.to(user._id).emit("user-left", { chat, user });
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
