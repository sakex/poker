export interface Sprite {
    draw: (x: number, y: number, width: number, height: number) => void;
}

export class GenericSprite implements Sprite {
    static readonly baseUrl = "/sprites/";
    protected image: HTMLImageElement;

    constructor(private readonly name: string, protected readonly ctx: CanvasRenderingContext2D) {
        this.image = new Image();
        this.image.src = `${GenericSprite.baseUrl}${name}`;
    }

    public draw = (x: number, y: number, width: number, height: number) => {
        this.ctx.drawImage(this.image, x, y, width, height);
    };
}