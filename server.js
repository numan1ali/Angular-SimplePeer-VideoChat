const express = require("express");
const http = require("http");
const app = express();
const server = http.Server(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};
const port = process.env.PORT || 8080;
io.on("connection", socket => {
    if(!users[socket.id])
        users[socket.id] = socket.id;
    socket.emit("yourID", socket.id);
    io.sockets.emit("allUsers", users);

    socket.on("disconnect", () => {
        delete users[socket.id];
    });
    socket.on("CallUser", (data) => {
        io.to(data.userToCall).emit("hey", {signal: data.signalData, from: data.from});
    });

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});
server.listen(port, () => console.log(`server is listening on port ${port}`));
