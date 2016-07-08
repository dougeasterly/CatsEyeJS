import Point from "../../geometry/point";

function drag(respond: (x: number, y: number) => void,
    event: MouseEvent): void {
    // Don't propagate the drag to the page.
    event.preventDefault();

    // Respond to the move.
    respond(event.movementX, event.movementY);
}

function end(respond: () => void): void {
    document.removeEventListener("mousemove", this.drag);
    document.removeEventListener("mouseup", this.end);
    respond();
}

export function listen(onDrag: (x: number, y: number) => void): Promise<{}> {
    return new Promise(function (resolve) {
        const bound = {} as {
            drag(event: MouseEvent): void,
            end(): void
        };

        bound.drag = drag.bind(bound, onDrag);
        bound.end = end.bind(bound, resolve);

        document.addEventListener("mousemove", bound.drag);
        document.addEventListener("mouseup", bound.end);
    });
}
