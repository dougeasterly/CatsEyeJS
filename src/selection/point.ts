import SelectionTriangle from "./triangle";
import CanvasComponent from "../canvas/component";
import * as mouse from "../interaction/drag/mouse";
import * as touch from "../interaction/drag/touch";
import Circle from "../geometry/circle";
import Point from "../geometry/point";
import * as storage from "../storage";

export default class SelectionPoint
    extends Circle implements CanvasComponent {
    // The radius of the selection points.
    public static POINT_RADIUS: number = 7;

    // The 'true' position of this point when the point is being bounded by the
    // selection walls.
    private truePosition: Point;

    // The containing selection triangle.
    public triangle: SelectionTriangle = null;

    constructor(x: number, y: number) {
        super(x, y, SelectionPoint.POINT_RADIUS);

        this.truePosition = new Point(x, y);
    }

    public moveTo(point: Point): void {
        super.moveTo(point);
        this.finalizePosition();
        this.redrawCanvas();
    }

    public draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = "red";
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
    }

    // Redraw the containing selection canvas.
    public redrawCanvas(): void {
        this.triangle.redrawCanvas();
    }

    // Indicate that the current position is now the true position of the point.
    public finalizePosition(): void {
        this.truePosition.x = this.x;
        this.truePosition.y = this.y;
    }

    public async onMouseDown(point: Point): Promise<void> {
        await mouse.listen(this.translate.bind(this));

        this.finalizePosition();
        storage.storeSelectionTriangle(this.triangle);
    }

    public async onTouchStart(point: Point, identifier: number): Promise<void> {
        await touch.listen(this.translate.bind(this), point, identifier);

        this.finalizePosition();
        storage.storeSelectionTriangle(this.triangle);
    }

    public contains(point: Point): boolean {
        return super.contains(point);
    }

    public translate(x: number, y: number): void {
        this.truePosition.translate(x, y);
        this.x = this.truePosition.x;
        this.y = this.truePosition.y;

        // Ensure that the point does not go out of bounds.
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x > this.triangle.maxX) {
            this.x = this.triangle.maxX;
        }

        if (this.y < 0) {
            this.y = 0;
        } else if (this.y > this.triangle.maxY) {
            this.y = this.triangle.maxY;
        }

        this.redrawCanvas();
    }
}
