// server.js
const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({dev});
const nexHandler = nextApp.getRequestHandler();

const {SocketWrapper} = require("./ws/connections");
const Lobby = require("./ws/poker/lobby");

SocketWrapper.IO = io;
Lobby.IO = io;

io.on("connection", client => {
    client.on("enterId", inputName => {
        SocketWrapper.addMember(inputName, client);
    });
});

nextApp.prepare().then(() => {
    app.get("*", (req, res) => {
        return nexHandler(req, res);
    });

    server.listen(3000, err => {
        if (err) throw err;
        console.log("> Ready on http://localhost:3000");
    });

});