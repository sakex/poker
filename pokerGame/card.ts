import {Sprite} from "./sprite";

interface SpritePosition {
    x: number,
    y: number
}

interface GenericPos {
    heart: SpritePosition,
    diamond: SpritePosition,
    club: SpritePosition,
    spade: SpritePosition,
}

interface HeadPos {
    11: GenericPos,
    12: GenericPos,
    13: GenericPos,
    14: GenericPos
}

export class Card implements Sprite {
    public static readonly colors = new Set(["heart", "diamond", "club", "spade"]);
    private static ctx: CanvasRenderingContext2D;
    private static image: HTMLImageElement;
    private static genericPos: GenericPos = {
        heart: {x: 185, y: 570},
        diamond: {x: 180, y: 1320},
        club: {x: 737, y: 570},
        spade: {x: 1264, y: 580}
    };

    private static headPos: HeadPos = {
        11: {
            heart: {x: 2420, y: 1348},
            diamond: {x: 740, y: 1358},
            club: {x: 1832, y: 1355},
            spade: {x: 1288, y: 1348}
        },
        12: {
            heart: {x: 2420, y: 2064},
            diamond: {x: 740, y: 2084},
            club: {x: 1832, y: 2064},
            spade: {x: 1288, y: 2054}
        },
        13: {
            heart: {x: 3496, y: 2064},
            diamond: {x: 2968, y: 2064},
            club: {x: 3492, y: 1348},
            spade: {x: 2964, y: 1348}
        },
        14: {
            heart: {x: 3504, y: 576},
            diamond: {x: 1832, y: 576},
            club: {x: 2972, y: 576},
            spade: {x: 2420, y: 576}
        }
    };

    public static setSrc = (src: string) => {
        Card.image = new Image();
        Card.image.src = src;
    }

    public static setContext = (ctx: CanvasRenderingContext2D) => {
        Card.ctx = ctx;
    }

    constructor(private value: number, private color: string) {
        if (!Card.colors.has(color)) throw new Error("Invalid color");
    }

    private findPos = (): SpritePosition => {
        if(this.value < 11) {
            return Card.genericPos[this.color];
        }
        else {
            return Card.headPos[this.value][this.color];
        }
    };

    public draw = (x: number, y: number, width: number, height: number) => {
        const posImage = this.findPos();
        Card.ctx.drawImage(Card.image, posImage.x, posImage.y, 476, 660, x, y, width, height);
        if(this.value < 11) {
            if(this.color === "heart" || this.color === "diamond"){
               Card.ctx.fillStyle = "#ea442c";
            }
            else {
                Card.ctx.fillStyle = "black";
            }
            Card.ctx.font = "30px Georgia";
            Card.ctx.fillText(this.value.toString(), x + 12, y + 23);
        }
    };
}

