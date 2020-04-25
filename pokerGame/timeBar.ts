export class TimeBar {
    private stopped: boolean = false;

    constructor(private from: number, private to: number, private x: number, private y: number, private ctx: CanvasRenderingContext2D) {
        this.start();
    }

    public stop = () => {
        this.stopped = true;
        this.ctx.clearRect(this.x, this.y + 140, 150, 10);
    };

    private start = () => {
        const render = () => {
            if (this.stopped) return;
            const len = ((this.to - new Date().getTime()) / (this.to - this.from)) * 150;
            if (len <= 0) {
                this.stop();
                return;
            }
            this.ctx.beginPath();
            this.ctx.clearRect(this.x, this.y + 140, 150, 10);
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(this.x, this.y + 140, 150, 10);
            this.ctx.fillStyle = "green";
            this.ctx.fillRect(this.x, this.y + 140, 150 - len, 10);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    };
}