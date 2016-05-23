import CanvasContainer from "./canvas/container";
import Point from "./geometry/point";
import Triangle from "./geometry/triangle";
import SquareTransform from "./render/square";

export default class Render extends CanvasContainer {
    private transform: SquareTransform;

    constructor(private image: HTMLImageElement,
        scale: number,
        showGrid: boolean) {
        super(document.createElement("canvas"));

        // TODO Expand the number of transforms available, and allow the user to
        // change them.
        this.transform = new SquareTransform(image, scale, showGrid);

        this.addComponent(this.transform);
    }

    // Make a single render on a canvas for the current image, to be repeated as a
    // pattern. The given triangle will be squared to ensure a consistent pattern
    // with no gaps.
    public makePattern(triangle: Triangle): HTMLCanvasElement {
        // Set the transform to use the given triangle.
        this.transform.triangle = triangle;

        // Scale the triangle to the render's scale.
        triangle = triangle.copy();
        triangle.scale(this.transform.scaleFactor);

        // Fetch the minimum dimension of the triangle.
        const bounds = triangle.boundingRectangle;
        const size = Math.min(bounds.width, bounds.height);

        // Make the canvas with edges of length twice the size of the triangle,
        // given that the image will be drawn twice in both dimensions, then
        // scaled to the tile scale value. These values are maxed out at 1 to
        // ensure the canvas is large enough to draw on.
        this.resize(Math.max(1, size * 2), Math.max(1, size * 2));

        // Move the origin into the middle of the canvas.
        this.translate(size, size);

        // Draw the pattern with a squared form of the given triangle.
        this.draw();

        // Return a snapshot of the canvas.
        return this.canvasSnapshot();
    }

    // Set the scale of the underlying transform.
    public set scaleFactor(scale: number) {
        this.transform.scaleFactor = scale;
    }

    // Set whether to show the transform grid.
    public set showGrid(showGrid: boolean) {
        this.transform.showGrid = showGrid;
    }
}
