import CanvasComponent from "../canvas/component";
import Point from "../geometry/point";
import Rectangle from "../geometry/rectangle";
import Triangle from "../geometry/triangle";

// Clip and rotate an image using squared triangles.
export default class SquareTransfrom
    extends Rectangle implements CanvasComponent {
    public triangle: Triangle = null;

    public redraw: () => void = null;

    constructor(private image: HTMLImageElement,
        public scaleFactor: number,
        public showGrid: boolean) {
        super(0, 0, image.width, image.height);
    }

    public drawImage(context: CanvasRenderingContext2D): void {
        // Fetch the bounding rectangle of the triangle.
        const bounds = this.triangle.boundingRectangle;

        // Fetch the width and height of the bounds.
        const triangleWidth = bounds.width;
        const triangleHeight = bounds.height;

        // Find the minimum length of the triangle, and use that to calculate a
        // scale for each dimension that will deform the image according to the
        // triangle.
        const size = Math.min(triangleWidth, triangleHeight);
        const scaleHorizontal = size / triangleWidth;
        const scaleVertical = size / triangleHeight;

        // Fetch the points nearest the top-left corner of the triangle, and use
        // that to work out how far back from the start of the canvas to start
        // drawing the image.
        const x = bounds.x * scaleHorizontal;
        const y = bounds.y * scaleVertical;

        // Scale the dimensions of the image both by the general scale and for
        // each specific dimension.
        const imageWidth =
            this.scaleFactor * this.image.width * scaleHorizontal;
        const imageHeight =
            this.scaleFactor * this.image.height * scaleVertical;

        // Draw the image, moved back to before the start of the canvas and
        // drawn past the end of the canvas for the area that needs to be
        // clipped as a rectangle.
        context.drawImage(this.image, -x, -y, imageWidth, imageHeight);
    }

    // Create a triangle path on the given context of the given size.
    public pathTriangle(context: CanvasRenderingContext2D,
        triangle: Triangle): void {
        context.beginPath();
        context.moveTo(triangle[0].x, triangle[0].y);
        context.lineTo(triangle[1].x, triangle[1].y);
        context.lineTo(triangle[2].x, triangle[2].y);
        context.lineTo(triangle[0].x, triangle[0].y);
        context.closePath();
    }

    // Path a triangle directly over the canvas: the canvas has already been
    // sized to the dimensions of the triangle, so the triangle we clip is
    // directly over the canvas. The points are adjusted slightly to account for
    // gaps in certain browser canvas rendering.
    public pathDefaultTriangle(context: CanvasRenderingContext2D): void {
        // Fetch the dimensions of the triangle.
        const bounds = this.triangle.boundingRectangle;
        const size = Math.min(bounds.width, bounds.height);

        this.pathTriangle(context, new Triangle(new Point(0, 0),
            new Point(size, 0), new Point(size, size)));
    }

    // Draw the given triangle on the current canvas.
    public drawTriangle(context: CanvasRenderingContext2D): void {
        // Path the default triangle.
        this.pathDefaultTriangle(context);

        // Draw along the path.
        context.stroke();
    }

    // Clip the given triangle on the current canvas.
    public clipTriangle(context: CanvasRenderingContext2D): void {
        // Path the default triangle.
        this.pathDefaultTriangle(context);

        // Draw along the path.
        context.clip();
    }

    public draw(context: CanvasRenderingContext2D): void {
        for (let i = 0; i < 4; i++) {
            // Draw a triangle and its reflection.
            for (let j = 0; j < 2; j++) {
                // Reflect the context (this will be undone in the next loop).
                context.scale(1, -1);

                // Save the context to ensure the clip does not apply in the
                // future, then clip the triangle and draw the image.
                context.save();
                this.clipTriangle(context);
                this.drawImage(context);

                // If the application has been asked to draw the clipping grid,
                // do so.
                if (this.showGrid) {
                    context.lineWidth = 6;
                    context.strokeStyle = "black";
                    this.drawTriangle(context);
                    context.lineWidth = 2;
                    context.strokeStyle = "white";
                    this.drawTriangle(context);
                }

                context.restore();
            }

            // Draw the inner loop at each of 4 rotation points around the
            // origin.
            context.rotate(Math.PI / 2);
        }
    }

    public onMouseDown(point: Point): void { }
    public onTouchStart(point: Point, identifier: number): void { }
}
