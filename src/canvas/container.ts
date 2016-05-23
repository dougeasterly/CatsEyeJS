import CanvasComponent from "./component";
import Point from "../geometry/point";

// An object with a canvas, which contains components. Handles both drawing and
// interaction (mouse and touch) events.
export default class CanvasContainer {
    protected context: CanvasRenderingContext2D;
    private components: Array<CanvasComponent> = [];

    constructor(private canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");

        const mouse = this.checkForMouseDragStart.bind(this);
        const touch = this.checkForTouchDragStart.bind(this);

        canvas.addEventListener("mousedown", mouse);
        canvas.addEventListener("touchstart", touch);
    }

    public get width(): number {
        return this.canvas.width;
    }

    public get height(): number {
        return this.canvas.height;
    }

    // Clone the underlying canvas and return it.
    public canvasSnapshot(): HTMLCanvasElement {
        const canvas = this.canvas.cloneNode() as HTMLCanvasElement;

        // Redraw the content on it.
        canvas.getContext("2d").drawImage(this.canvas, 0, 0);

        return canvas;
    }

    // Resize the canvas.
    public resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    // Translate drawing on the canvas.
    public translate(x: number, y: number): void {
        this.context.translate(x, y);
    }

    // Add a component to this canvas.
    public addComponent(component: CanvasComponent): void {
        this.components.push(component);
    }

    // Remove a component from this canvas. Does nothing if the component is not
    // on this canvas.
    public removeComponent(component: CanvasComponent): void {
        const index = this.components.indexOf(component);

        if (index >= 0) {
            this.components.splice(index, 1);
        }
    }

    // Remove all components from this canvas.
    public clearComponents(): void {
        this.components = [];
    }

    // Draw all of the components on this canvas.
    public draw(): void {
        // Wipe the canvas first.
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all of the components, in order.
        for (let component of this.components) {
            component.draw(this.context);
        }
    }

    // Handle the beginning of a mouse drag event on the canvas.
    private checkForMouseDragStart(event: MouseEvent): void {
        if (event.button !== 0) {
            return;
        }

        // Calculate the offset from the canvas element.
        const point = new Point(event.pageX - this.canvas.offsetLeft,
            event.pageY - this.canvas.offsetTop);

        this.checkComponentDrag(point, (component: CanvasComponent) => {
            component.onMouseDown(point);
        });
    }

    // Handle the beginning of a touch drag event on the canvas.
    private checkForTouchDragStart(event: TouchEvent): void {
        const touches = event.changedTouches;

        for (let i: number = 0; i < touches.length; i++) {
            const touch = touches[i];

            // Calculate the offset from the canvas element.
            const point = new Point(touch.pageX - this.canvas.offsetLeft,
                touch.pageY - this.canvas.offsetTop);

            this.checkComponentDrag(point, (component: CanvasComponent) => {
                component.onTouchStart(point, touch.identifier);
            });
        }
    }

    protected checkComponentDrag(point: Point,
        response: (component: CanvasComponent) => void) {
        // Loop backwards through the components, to ensure that the front-most
        // component is found if components overlap.
        for (let i = this.components.length - 1; i >= 0; i--) {
            const component = this.components[i];

            if (component.contains(point)) {
                response(component);
                break;
            }
        }
    }
}
