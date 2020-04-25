const Game = require("./game");

class Lobby {
    static maxPlayer = 6;
    static games = {};
    static lastGame = 0;

    constructor(socket, id) {
        this.socket = socket;
        this.id = id;
        this.feedSocket();
        this.game = null;
    }

    emitTables = () => {
        Lobby.IO.emit("tables", Object.keys(Lobby.games)
            .filter(key => !Lobby.games[key].started).map(key => {
                return {id: key, players: Lobby.games[key].players.length};
            }));
    };

    feedSocket = () => {
        setTimeout(() => {
            this.socket.emit("tables", Object.keys(Lobby.games).map(key => {
                return {id: key, players: Lobby.games[key].players.length};
            }));
        }, 1000);

        this.socket.on("join", (id) => {
            try {
                const game = Lobby.games[id];
                if (!game.players.includes(this) && game.players.length < Lobby.maxPlayer) {
                    const index = game.addPlayer(this);
                    this.socket.emit("joined", index);
                    this.game = game;
                    this.emitTables();
                }
            } catch (e) {
                console.error(e);
            }
        })
            .on("create", async (id) => {
                const current = Lobby.lastGame++;
                const game = new Game(`${id}_${current}`);
                Lobby.games[`${id}_${current}`] = game;
                const index = game.addPlayer(this);
                this.game = game;
                this.emitTables();
                this.socket.emit("joined", index);
            })
            .on("start", async () => {
                try {
                    await this.game.start();
                    delete Lobby.games[this.game.id];
                    this.emitTables();
                } catch (e) {
                    console.error(e);
                }
            })
            .on("leave", async () => {
                const index = this.game.players.indexOf(this);
                this.game.players.splice(index, 1);
                if (this.game.players.length === 0) {
                    delete Lobby.games[this.game.id];
                }
                this.game = undefined;
                this.socket.emit("joined", -1);
                this.emitTables();
            });

    };
}


module.exports = Lobby;
