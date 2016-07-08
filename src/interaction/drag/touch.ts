import Point from "../../geometry/point";

function drag(respond: (x: number, y: number) => void,
    event: TouchEvent): void {
    // Don't propagate the drag to the page.
    event.preventDefault();

    // Respond to the move.
    const touches = event.changedTouches;

    for (let i: number = 0; i < touches.length; i++) {
        const touch = touches[i];

        if (touch.identifier === this.identifier) {
            // Determine where the touch is relative to the canvas.
            const point =
                new Point(touch.pageX - this.element.offsetLeft,
                    touch.pageY - this.element.offsetTop);

            // Calculate the offset from the last point.
            const offset = point.offsetFrom(this.lastPoint);

            // Set the last point to be this new point.
            this.lastPoint = point;

            // Respond to the move.
            respond(offset.x, offset.y);

            return;
        }
    }
}

function end(respond: () => void): void {
    document.removeEventListener("touchmove", this.drag);
    document.removeEventListener("touchend", this.end);
    document.removeEventListener("touchcancel", this.end);
    respond();
}

export function listen(onDrag: (x: number, y: number) => void,
    point: Point, identifier: number): Promise<{}> {
    return new Promise(function (resolve) {
        const bound = {
            lastPoint: point,
            identifier: identifier
        } as {
                lastPoint: Point,
                identifier: number,
                drag(event: TouchEvent): void,
                end(): void
            };

        bound.drag = drag.bind(bound, onDrag);
        bound.end = end.bind(bound, resolve);

        document.addEventListener("touchmove", bound.drag);
        document.addEventListener("touchend", bound.end);
        document.addEventListener("touchcancel", bound.end);
    });
}
