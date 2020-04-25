import {Card} from "./card";
import {TableData} from "@components/lobby";
import {TimeBar} from "./timeBar";

export interface PokerState {
    index: number,
    cards: string[],
    currentPlayer: number,
    dealer: number,
    highestBet: number,
    firstHighestPlayer: number,
    bets: number[],
    tokens: number[],
    pot: number[],
    flop: [number, string][],
    river: [number, string],
    turn: [number, string],
    playing: boolean[],
    raise: number,
    tables: TableData[],
    started: boolean,
    timerStart: number,
    timerEnd: number,
}

export class PokerGame {
    private readonly ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private readonly canvas;
    private cards: Card[] = [];
    private seats: [number, number][] = [];
    private betsPos: [number, number][] = [];
    private midPos: [number, number][] = [];
    private tokenPos: [number, number][] = [];
    private timeBar: TimeBar;
    private midCards: Card[] = [];
    private state: PokerState = new class implements PokerState {
        bets: number[];
        cards: string[];
        currentPlayer: number;
        dealer: number;
        firstHighestPlayer: number;
        flop: [number, string][] = [];
        highestBet: number;
        index: number;
        playing: boolean[];
        pot: number[];
        raise: number;
        river: [number, string];
        started: boolean;
        tables: TableData[];
        timerEnd: number;
        timerStart: number;
        tokens: number[] = [];
        turn: [number, string];
    };

    constructor(private readonly parent: HTMLElement, private index: number) {
        this.state.tokens = new Array(index + 1).fill(1000);
        Card.setSrc("/sprites/cards.png");
        this.width = parent.offsetWidth;
        this.height = parent.offsetHeight;
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.style.zIndex = "4";
        canvas.width = this.width;
        canvas.height = this.height;
        parent.appendChild(canvas);
        this.ctx = canvas.getContext("2d");
        Card.setContext(this.ctx);
        this.canvas = canvas;
        document.body.onresize = this.onResize;
        this.setSeatsPos();
    }

    public getSeat = (index: number): [number, number] => {
        const pos = index >= this.index ? (index - this.index) : (6 - this.index + index);
        return this.seats[pos];
    };

    private setSeatsPos = () => {
        const seats = [[600, 650], [30, 520], [60, 30], [600, 0], [1135, 30], [1150, 600]];
        const betsPos = [[620, 550], [230, 500], [167, 300], [480, 150], [1155, 350], [1190, 550]];
        const midPos = [[450, 330], [540, 330], [630, 330], [720, 330], [810, 330]];
        const tokenPos = [[600, 600], [200, 560], [142, 250], [460, 100], [1135, 300], [1170, 600]];
        const wScale = this.width / 1376;
        const hScale = this.height / 891;
        this.seats = seats.map((pair: number[]) => [pair[0] * wScale, pair[1] * hScale]);
        this.betsPos = betsPos.map((pair: number[]) => [pair[0] * wScale, pair[1] * hScale]);
        this.midPos = midPos.map((pair: number[]) => [pair[0] * wScale, pair[1] * hScale]);
        this.tokenPos = tokenPos.map((pair: number[]) => [pair[0] * wScale, pair[1] * hScale]);
    };

    public setIndex = (index: number) => {
        this.index = index;
    };

    public setState = (state: PokerState) => {
        if (this.state.timerStart !== state.timerStart) {
            this.changeTimer(state.timerStart, state.timerEnd);
        }
        if (this.state.flop.length === 0 && state.flop.length === 3) {
            this.gotFlop(state.flop);
        } else if (!this.state.river && state.river) {
            this.gotRiverTurn(state.river);
        } else if (!this.state.turn && state.turn) {
            this.gotRiverTurn(state.turn);
        }
        this.state = state;
        this.render();
    };

    private changeTimer = (start: number, end: number) => {
        if (this.timeBar) this.timeBar.stop();
        if (start && end && this.seats.length) {
            const index = this.state.currentPlayer;
            const pos = index >= this.index ? (index - this.index) : (6 - this.index + index);
            const [x, y] = this.seats[pos];
            this.timeBar = new TimeBar(start, end, x, y, this.ctx);
        }
    };

    private onResize = () => {
        this.width = this.parent.offsetWidth;
        this.height = this.parent.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.setSeatsPos();
        this.render();
    };

    public gotCards = (firstCard: [number, string], secondCard: [number, string]) => {
        this.midCards = [];
        const c1 = new Card(...firstCard);
        const c2 = new Card(...secondCard);
        this.cards = [c1, c2];
        this.render();
    };

    private gotFlop = (cards: [number, string][]) => {
        this.midCards = cards.map(card => new Card(card[0], card[1]));
    };

    private gotRiverTurn = (card: [number, string]) => {
        this.midCards.push(new Card(card[0], card[1]));
    };

    private render = () => {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.beginPath();
        if (this.cards.length) {
            this.cards[0].draw(this.seats[0][0], this.seats[0][1], 80, 120);
            this.cards[1].draw(this.seats[0][0] + 70, this.seats[0][1], 80, 120);
        }
        if (this.midCards.length) {
            this.midCards.forEach((card, index) => {
                const [x, y] = this.midPos[index];
                card.draw(x, y, 80, 120);
            });
        }
        this.ctx.font = "30px Georgia";
        this.state.tokens.forEach((token, index) => {
            const pos = index >= this.index ? (index - this.index) : (6 - this.index + index);
            const [x, y] = this.tokenPos[pos];
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(x - 10, y - 30, 100, 50);
            this.ctx.fillStyle = "gold";
            this.ctx.fillText(`$ ${token}`, x, y); // Tokens
            if (this.state.bets && this.state.bets.length && this.state.bets[index]) {
                const [bX, bY] = this.betsPos[pos];
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(bX - 30, bY - 30, 100, 50);
                this.ctx.fillStyle = "gold";
                this.ctx.fillText(`$ ${this.state.bets[index]}`, bX, bY);
            }
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(this.width / 2 - 100, 200, 200, 50);
            this.ctx.fillStyle = "gold";
            this.ctx.fillText(`$ ${this.state.pot}`, this.width / 2 - 90, 225);
        });
        this.ctx.closePath();
    };

}