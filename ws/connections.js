const Lobby = require("./poker/lobby");

class SocketWrapper {
    static connections = {};
    static currentId = 0;
    static IO;

    constructor(socket, id) {
        this.socket = socket;
        this.id = id;
        this.lobby = new Lobby(socket, id);
        this.feedSocket();
    }

    emit = (message, data) => {
        this.socket.emit(message, data);
    };

    static addMember = (inputName, socket) => {
        const current = SocketWrapper.currentId++;
        const name = `${inputName}_${current}`;
        SocketWrapper.connections[name] = new SocketWrapper(socket, name);
        socket.emit("connectionId", name);
        SocketWrapper.emitMembers();
    };

    static emitMembers = () => {
        SocketWrapper.IO.emit("members", Object.keys(SocketWrapper.connections));
    };

    feedSocket = () => {
        this.socket.on("call", ({id, senderId, data}) => {
            try {
                SocketWrapper.connections[id].emit("call", {id, senderId, data});
            } catch (err) {
                this.socket.emit("err", `${id} not connected`);
            }
        })
            .on("answer", ({id, senderId, data}) => {
                try {
                    SocketWrapper.connections[id].emit("answer", {id, senderId, data});
                } catch (err) {
                    this.socket.emit("err", `${id} not connected`);
                }
            })
            .on("callMembers", ({id, members}) => {
                try {
                    SocketWrapper.connections[id].emit("callMembers", members);
                } catch (err) {
                    this.socket.emit("err", `${id} not connected`);
                }
            })
            .on("candidate", ({id, senderId, candidate}) => {
                try {
                    SocketWrapper.connections[id].emit("candidate", {id, senderId, candidate});
                } catch (err) {
                    this.socket.emit("err", `${id} not connected`);
                }
            })
            .on("disconnect", () => {
                try {
                    delete SocketWrapper.connections[this.id];
                    SocketWrapper.emitMembers();
                } catch (err) {

                }
            });
    };
}

module.exports = {SocketWrapper};