import CanvasContainer from "./canvas/container";
import CanvasComponent from "./canvas/component";
import CanvasImage from "./canvas/image";
import Point from "./geometry/point";
import SelectionPoint from "./selection/point";
import SelectionTriangle from "./selection/triangle";

export default class Selection extends CanvasContainer {
    private parentElement: HTMLElement;
    private imageElement: HTMLImageElement = null;
    public triangle: SelectionTriangle = null;

    private previewUpdateEventID: number;

    constructor(canvas: HTMLCanvasElement, private updatePreview: () => void) {
        super(canvas);

        this.parentElement = canvas.parentElement;
    }

    public get width(): number {
        return this.imageElement.width;
    }

    public get height(): number {
        return this.imageElement.height;
    }

    public get image(): HTMLImageElement {
        return this.imageElement;
    }

    // Set the image and reset the selection points.
    public set image(image: HTMLImageElement) {
        this.reset();

        // Save the image first, to ensure width and height can be calculated.
        this.imageElement = image;

        // Resize the canvas to the new image size, taking into account spacing
        // for the selection points.
        const pRad = SelectionPoint.POINT_RADIUS;
        this.resize(this.width + pRad * 2, this.height + pRad * 2);

        // Reset the triangle to the dimensions of the image.
        this.triangle =
            new SelectionTriangle(this, new SelectionPoint(0, 0),
                new SelectionPoint(this.width, 0),
                new SelectionPoint(this.width, this.height));

        // Add the image and triangle components.
        this.addComponent(new CanvasImage(0, 0, this.image));
        this.addComponent(this.triangle);
        for (let point of this.triangle) {
            this.addComponent(point);
        }

        // Show the selection pane if it was hidden.
        this.isVisible = true;

        // Redraw the selection.
        this.draw();
    }

    public draw(): void {
        this.context.save();

        // Wipe extra space for the translated canvas.
        const pRad = SelectionPoint.POINT_RADIUS;
        this.context.clearRect(0, 0,
            this.width + pRad * 2, this.height + pRad * 2);

        // Translate the canvas to ensure the radius of the selection points is
        // taken into account.
        this.context.translate(pRad, pRad);

        super.draw();

        this.context.restore();

        // Update the preview in 20ms, but if a move is made within that
        // time cancel the update and let the next move redraw.
        clearTimeout(this.previewUpdateEventID);
        this.previewUpdateEventID = setTimeout(this.updatePreview, 20);
    }

    // The appropriate scale for the selector based on the ratio of the image
    // size to the size of the document.
    public get documentScale(): number {
        // Fetch the document element so we can examine its size in comparison
        // to the image, to ensure the selection preview doesn't take up too
        // much space.
        const html = document.documentElement;

        // Start with a scale of 1:1.
        let scale = 1;

        // If the width of the image exceeds a quarter of the display, shrink
        // the width to that quarter and the height to match.
        if (this.imageElement.width > html.offsetWidth / 4) {
            scale = html.offsetWidth / 4 / this.imageElement.width;
        }

        // Whether or not the height has been shrunk, if the height of the image
        // still exceeds a quarter of the display, shrink the height to that
        // quarter and the width to match. As this process can only make the
        // width smaller, it does not invalidate the shrinking above.
        if (this.imageElement.height * scale > html.offsetHeight / 4) {
            scale = html.offsetHeight / 4 / this.imageElement.height;
        }

        return scale;
    }

    protected checkComponentDrag(point: Point,
        response: (component: CanvasComponent) => void): void {
        // Move the point backwards to account for canvas translation.
        point.move(-SelectionPoint.POINT_RADIUS);
        super.checkComponentDrag(point, response);
    }

    // Remove the current image and hide the selection pane.
    public reset(): void {
        // Remove the triangle from the canvas.
        this.clearComponents();

        // Reset the state of the selection.
        this.imageElement = null;
        this.triangle = null;

        // Hide the selection pane if it was shown.
        this.isVisible = false;
    }

    public get isVisible(): boolean {
        return this.parentElement.style.display === "none";
    }

    // Change the visibility of the canvas' container.
    public set isVisible(visible: boolean) {
        this.parentElement.style.display = visible ? "inline-block" : "none";
    }
}
