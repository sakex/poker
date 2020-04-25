const Card = require("./card");
const Interactions = require("./interactions");
const Hand = require("./hand");

const TIMER = 20 * 1000;

const shuffleArray = (arr) => {
    let currentIndex = arr.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = arr[currentIndex];
        arr[currentIndex] = arr[randomIndex];
        arr[randomIndex] = temporaryValue;
    }
    return arr;
};

class Game {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.deck = null;
        this.smallBlind = 5;
        this.bigBlind = 10;

        this.nextFunc = null;
        this.timeout = null;


        this.state = {
            dealer: -1,
            firstHighestPlayer: -1,
            currentPlayer: -1,
            bets: [],
            tokens: [],
            highestBet: 0,
            pot: 0,
            flop: [],
            river: null,
            turn: null,
            playing: [],
            started: false,
            winner: [],
            timerStart: null,
            timerEnd: null,
            isTapis: [],
            tapisBet: [],
            playerCards: [],
        };
    }

    addPlayer = newPlayer => {
        this.players.push(newPlayer);
        const newIndex = this.players.length - 1;
        setTimeout(() => {
            this.players.forEach((player, index) => {
                const shouldCall = (newPlayer.id !== player.id);
                newPlayer.socket.emit("newPlayer", {id: player.id, index, shouldCall});
            });
            this.players.forEach((player) => {
                player.socket.emit("newPlayer", {id: newPlayer.id, index: newIndex, shouldCall: false});
            });
            this.players.forEach((player) => {
                player.socket.emit("members", this.players.map(({id}) => id));
            });
        }, 5000);
        return this.players.length - 1;
    };

    feedInteractions = () => {
        this.players.forEach((player, index) => new Interactions(this, player, index));
    };

    emitState = () => {
        this.players.forEach((player, index) => {
            player.socket.emit("state", this.state, index);
        });
    };

    start = () => {
        this.players.forEach(_ => this.state.tokens.push(1000));
        this.feedInteractions();
        this.state.dealer = Math.round(Math.random() * this.players.length);
        this.state.firstHighestPlayer = (this.state.dealer + 2) % this.players.length;
        this.state.currentPlayer = (this.state.dealer + 3) % this.players.length;
        this.state.started = true;
        this.blinds();
    };

    findNextPlayer = () => {
        let it = this.state.currentPlayer + 1;
        for (; it < this.state.playing.length; ++it) if (this.state.playing[it]) return it;
        for (it = 0; it <= this.state.currentPlayer; ++it) if (this.state.playing[it]) return it;
    };

    playerTurn = () => {
        clearTimeout(this.timeout);
        let inGame = 0;
        let index = 0;
        for (let it = 0; it < this.state.playing.length; ++it) { // Check if only one player left
            if (this.state.playing[it]) {
                index = it;
                inGame++;
                if (inGame === 2) break;
            }
        }
        if (inGame === 1) {
            this.winPot([{player: this.players[index]}], this.state.pot);
            this.state.pot = 0;
            this.state.currentPlayer = -1;
            setTimeout(this.blinds, 5000);
            return;
        }
        this.state.currentPlayer = this.findNextPlayer();
        this.emitState();
        if (this.state.currentPlayer !== this.state.firstHighestPlayer) {
            this.turnTable();
        } else {
            this.nextFunc();
        }
    };

    turnTable = () => {
        this.state.timerStart = new Date().getTime();
        this.state.timerEnd = this.state.timerStart + TIMER;
        this.emitState();
        this.timeout = setTimeout(() => {
            if (this.state.bets[this.state.currentPlayer] < this.state.highestBet) {
                this.fold(this.state.currentPlayer);
            }
            this.playerTurn();
        }, TIMER);
    };

    pay = (index, amount, blind = false) => {
        try {
            if (!blind && index !== this.state.currentPlayer) return false;
            const totalBet = amount + this.state.bets[index];
            if (amount === this.state.tokens[index] ||
                totalBet === this.state.highestBet ||
                totalBet >= this.state.highestBet + this.smallBlind) {
                this.state.bets[index] += amount;
                if (amount === this.state.tokens[index] && amount !== 0) {
                    this.state.isTapis.push([index, this.state.bets[index]]);
                }
                this.state.pot += amount;
                this.state.tokens[index] -= amount;
                if (totalBet > this.state.highestBet) {
                    this.state.highestBet = totalBet;
                    this.state.firstHighestPlayer = index;
                }
                this.emitState();
                return true;
            } else {
                this.players[index].socket.emit("err", "Amount raised too low");
                return false;
            }
        } catch (err) {
            console.error(err);
        }
    };

    blinds = () => {
        this.state.bets = [];
        this.state.playing = [];
        this.state.playerCards = [];
        this.players.forEach(_ => {
            this.state.bets.push(0);
            this.state.playing.push(true);
        });
        this.dealerChange();
        this.state.currentPlayer = this.state.dealer;
        this.state.currentPlayer = this.findNextPlayer();
        const smallPos = this.state.currentPlayer;
        this.state.currentPlayer = this.findNextPlayer();
        const bigPos = this.state.currentPlayer;
        this.state.currentPlayer = this.findNextPlayer();
        this.state.flop = [];
        this.state.river = null;
        this.state.turn = null;
        this.state.highestBet = 0;
        this.pay(smallPos, this.smallBlind, true);
        this.pay(bigPos, this.bigBlind, true);
        this.state.currentPlayer = (this.state.dealer + 2) % this.players.length;
        this.state.currentPlayer = this.findNextPlayer();
        this.state.firstHighestPlayer = this.state.currentPlayer;
        this.distributeCards();
        this.emitState();
        this.nextFunc = this.flop;
        this.turnTable();
    };

    flop = () => {
        this.resetBets();
        this.state.currentPlayer = (this.state.dealer + 2) % this.players.length;
        this.state.currentPlayer = this.findNextPlayer();
        this.state.firstHighestPlayer = this.state.currentPlayer;
        for (let i = 0; i < 3; ++i) this.state.flop.push(this.deck.pop().serialize());
        this.emitState();
        this.nextFunc = this.river;
        this.turnTable();
    };

    river = () => {
        this.resetBets();
        this.state.currentPlayer = (this.state.dealer + 2) % this.players.length;
        this.state.currentPlayer = this.findNextPlayer();
        this.state.firstHighestPlayer = this.state.currentPlayer;
        this.state.river = this.deck.pop().serialize();
        this.emitState();
        this.nextFunc = this.turn;
        this.turnTable();
    };

    turn = () => {
        this.resetBets();
        this.state.turn = this.deck.pop().serialize();
        this.state.currentPlayer = (this.state.dealer + 2) % this.players.length;
        this.state.currentPlayer = this.findNextPlayer();
        this.state.firstHighestPlayer = this.state.currentPlayer;
        this.emitState();
        this.nextFunc = this.overallWinners;
        this.turnTable();
    };

    overallWinners = () => {
        this.players.forEach(player => player.socket.emit("winners", "in decide"));
        const cards = [...this.state.flop, this.state.river, this.state.turn];
        if (this.state.tapisBet.length) {
            this.state.tapisBet.forEach(object => {
                this.decideWinner(cards, object.pot, this.players.filter((player, index) =>
                    object.contenders.includes(index) && player));
            });
            this.state.tapisBet = [];
        }
        if (this.state.pot !== 0) this.decideWinner(cards, this.state.pot, this.players.filter((player, index) => this.state.playing[index] && player));
        this.state.pot = 0;
        this.state.currentPlayer = -1;
        this.state.playerCards = this.players.map(player => player.cards);
        this.emitState();
        setTimeout(this.blinds, 10000);
    };


    decideWinner = (cards, pot, players) => {
        const hands = players.map((player) => {
            const cardCp = [...cards, ...player.cards];
            const values = {};
            const colors = {};
            cardCp.forEach((card) => {
                const [value, color] = card;
                if (value in values) values[value]++;
                else values[value] = 1;
                if (color in colors) colors[color].push(card);
                else colors[color] = [card];
            });
            return new Hand(values, colors, player);
        });

        const winners = Hand.compareHands(hands);
        console.log(winners);
        // this.players.forEach(player => player.socket.emit("winners", winners));
        this.winPot(winners, pot);
    };

    resetBets = () => {
        if (this.state.isTapis.length) {
            const contenders = [];
            let tapisPot = 0;
            this.state.playing.forEach((value, index) => {
                if (value === true) contenders.push(index);
            });
            this.state.isTapis.sort((a, b) => a[1] - b[1]).forEach(element => {
                if (this.state.playing[element[0]]) {

                    tapisPot = element[1] * contenders.length;
                    this.state.pot -= tapisPot;
                    this.state.playing[element[0]] = false;
                    contenders.forEach(value => {
                        this.state.bets[value] -= element[1];
                        if (this.state.tokens[value] === 0) this.state.playing[value] = false; //to skip the ones who made tapis
                    });
                    this.state.tapisBet.push({pot: tapisPot, contenders: contenders});
                }
            });
            this.state.isTapis = [];
        }
        this.state.highestBet = 0;
        for (let i = 0; i < this.state.bets.length; ++i) this.state.bets[i] = 0;
    };

    winPot = (arr, pot) => {
        const arrLength = arr.length;
        const amount = Math.round(pot / arrLength);
        arr.forEach(winner => {
            this.state.tokens[winner.player.index] += amount;
        });
    };

    distributeCards = () => {
        const deck = [];
        for (let i = 2; i < 14; ++i) {
            Card.colors.forEach(color => deck.push(new Card(i, color)));
        }
        this.deck = shuffleArray(deck);
        const toSend = [];
        this.players.forEach(_ => {
            toSend.push([this.deck.pop().serialize()]);
        });
        toSend.forEach(arr => {
            arr.push(this.deck.pop().serialize());
        });
        this.players.forEach((player, index) => {
            player.cards = toSend[index];
            player.socket.emit("cards", toSend[index]);
        });
    };

    dealerChange = () => {
        this.state.currentPlayer = this.state.dealer;
        this.state.dealer = this.findNextPlayer();
        this.state.currentPlayer = (this.state.dealer + 1) % this.players.length;
        this.state.firstHighestPlayer = this.findNextPlayer();
    };

    fold = (index) => {
        if (index === this.state.currentPlayer) {
            this.state.playing[index] = false;
            if (index === this.state.firstHighestPlayer) this.state.firstHighestPlayer = this.findNextPlayer();
            this.playerTurn();
        }
    };
}

module.exports = Game;

