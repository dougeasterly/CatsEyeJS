// The abstract super class of objects with a canvas to draw a pattern on.
export default class PatternDraw {
    private context: CanvasRenderingContext2D;
    private patternElement: HTMLImageElement | HTMLCanvasElement = null;

    constructor(protected canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");
    }

    public get pattern(): HTMLImageElement | HTMLCanvasElement {
        return this.patternElement;
    }

    // This is provided as a default: a class may override this to provide extra
    // functionality.
    public set pattern(patternElement: HTMLImageElement | HTMLCanvasElement) {
        this.patternElement = patternElement;
    }

    // Draw the pattern onto the canvas.
    public drawPattern(): void {
        // Repeat the pattern in the context.
        const pattern = this.context.createPattern(this.pattern, "repeat");

        // Fetch the width and height of the canvas.
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Move the origin to the center of the canvas, and then draw a
        // rectangle from back at the top left corner to the size of the large
        // canvas. Fill the rectangle with the repeating pattern of the smaller
        // canvas.
        this.context.translate(width / 2, height / 2);
        this.context.rect(-width / 2, -height / 2, width, height);
        this.context.fillStyle = pattern;
        this.context.fill();
    }
}
