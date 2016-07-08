import DataError from "../error/data";
import Point from "../geometry/point";
import Triangle from "../geometry/triangle";
import CanvasComponent from "../canvas/component";
import * as mouse from "../interaction/drag/mouse";
import * as touch from "../interaction/drag/touch";
import Selection from "../selection";
import SelectionPoint from "./point";
import * as storage from "../storage";

export default class SelectionTriangle
    extends Triangle implements CanvasComponent {
    // Specialize the types of the points.
    public 0: SelectionPoint;
    public 1: SelectionPoint;
    public 2: SelectionPoint;

    constructor(private selection: Selection,
        a: SelectionPoint, b: SelectionPoint, c: SelectionPoint) {
        super(a, b, c);

        // Set this triangle as the container of the given points.
        for (let point of this) {
            point.triangle = this;
        }
    }

    public get maxX(): number {
        return this.selection.width;
    }

    public get maxY(): number {
        return this.selection.height;
    }

    // Specialize the type of the iterator.
    public *[Symbol.iterator](): Iterator<SelectionPoint> {
        yield this[0];
        yield this[1];
        yield this[2];
    }

    public draw(context: CanvasRenderingContext2D): void {
        // Draw the lines between the points.
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this[0].x, this[0].y);
        context.lineTo(this[1].x, this[1].y);
        context.lineTo(this[2].x, this[2].y);
        context.closePath();
        context.stroke();

        // Draw the selection points over the top.
        this[0].draw(context);
        this[1].draw(context);
        this[2].draw(context);
    }

    // Redraw the containing selection canvas.
    public redrawCanvas(): void {
        this.selection.draw();
    }

    public async onMouseDown(point: Point): Promise<void> {
        await mouse.listen(this.translate.bind(this));

        for (let point of this) {
            point.finalizePosition();
        }

        storage.storeSelectionTriangle(this);
    }

    public async onTouchStart(point: Point, identifier: number): Promise<void> {
        await touch.listen(this.translate.bind(this), point, identifier);

        for (let point of this) {
            point.finalizePosition();
        }

        storage.storeSelectionTriangle(this);
    }

    public translate(x: number, y: number): void {
        super.translate(x, y);

        // Redraw after this component is moved.
        this.redrawCanvas();
    }
}
