import Point from "../geometry/point";

// The interface for children of the Canvas object.
interface CanvasComponent {
    // Draw this component with the given context.
    draw(context: CanvasRenderingContext2D): void;

    // Determine whether the given point (relative from canvas) is contained
    // within this component.
    contains(point: Point): boolean;

    // React to a mouse down event.
    onMouseDown(point: Point): void;

    // React to a single touch event.
    onTouchStart(point: Point, identifier: Number): void;
}

export default CanvasComponent;
