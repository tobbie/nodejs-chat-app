const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectory = path.join(__dirname, "../public");

//server emits --> client (recieve) --> countUpdated
//client emits --> server (recieve) --> increment

let count = 0;
//socket.emit, io.emit, socket.broadcast.emit
//io.to.emit, socket.broadcast.to.emit

io.on("connection", (socket) => {
  //console.log('new websocket connection');

  socket.on("Join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("messageClient", generateMessage("Admin", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "messageClient",
        generateMessage("Admin", `${user.username} has joined`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("invalid user");
    }

    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("profanity not allowed");
    }

    io.to(user.room).emit(
      "messageClient",
      generateMessage(user.username, message)
    );
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("invalid user");
    }

    const url = `http://google.com/maps?q=${coords.latitude},${coords.longitude}`;
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username, url)
    );
    callback("coordinates delivered to clients");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "messageClient",
        generateMessage("Admin", `${user.username} has left the chat`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});
//set up static directory to serve
app.use(express.static(publicDirectory));

server.listen(port, () => {
  console.log(`chat-app is listening on port ${port}`);
});
