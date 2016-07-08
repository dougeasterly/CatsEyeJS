import PatternDraw from "./draw";

// A preview of the current cats-eye render.
export default class PatternPreview extends PatternDraw {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
    }

    public get pattern(): HTMLImageElement | HTMLCanvasElement {
        return super.pattern;
    }

    public set pattern(patternElement: HTMLImageElement | HTMLCanvasElement) {
        super.pattern = patternElement;
        this.draw();
    }

    // Draw the preview render, resizing the canvas to fill its container.
    public draw(): void {
        // Fetch the container of the canvas.
        const container = this.canvas.parentElement;

        // Set the size of the canvas to 0, to allow the container to return to
        // its natural size.
        this.canvas.width = 0;
        this.canvas.height = 0;

        // Set the size of the preview canvas to the size of the container.
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;

        // Draw the pattern on the preview canvas.
        this.drawPattern();
    }
}
