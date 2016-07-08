import CanvasComponent from "./component";
import Point from "../geometry/point";
import Rectangle from "../geometry/rectangle";

export default class CanvasImage extends Rectangle implements CanvasComponent {
    public redraw: () => void = null;

    constructor(x: number, y: number, private element: HTMLImageElement) {
        super(x, y, element.width, element.height);
    }

    public draw(context: CanvasRenderingContext2D): void {
        context.drawImage(this.element, this.x, this.y);
    }

    public onMouseDown(point: Point): void { }
    public onTouchStart(point: Point, identifier: Number): void { }
}
