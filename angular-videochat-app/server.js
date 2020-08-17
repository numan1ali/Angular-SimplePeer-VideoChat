const express = require("express");
const http = require("http");
const app = express();
const server = http.Server(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};
const port = process.env.PORT || 8080;
// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/dist/angular-videochat-app'));

app.get('/*', function(req,res) {

res.sendFile(path.join(__dirname+'/dist/angular-videochat-app/index.html'));
});

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
// server.listen(port, () => console.log(`server is listening on port ${port}`));
// Start the app by listening on the default Heroku port
server.listen(process.env.PORT || 8080);

