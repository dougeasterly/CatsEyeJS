import Point from "./point";
import DataError from "../error/data";

// Mutable rectangle objects.
export default class Rectangle {
    private topLeft: Point;

    constructor(x: number,
        y: number,
        public width: number,
        public height: number) {
        this.topLeft = new Point(x, y);
    }

    public static fromData(data: any): Rectangle {
        if (!data.x || !data.y || !data.width || !data.height) {
            throw new DataError("Rectangle",
                "must have x, y, width, and height as numbers");
        }

        return new Rectangle(data.x, data.y, data.width, data.height);
    }

    public get x(): number {
        return this.topLeft.x;
    }

    public set x(x: number) {
        this.topLeft.x = x;
    }

    public get y(): number {
        return this.topLeft.y;
    }

    public set y(y: number) {
        this.topLeft.y = y;
    }

    // Create a copy of this rectangle.
    public copy(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    // Translate the position of this rectangle in both directions by an amount.
    public move(amount: number): void {
        this.topLeft.move(amount);
    }

    // Translate the position of this rectangle by an x and y amount.
    public translate(x: number, y: number): void {
        this.topLeft.translate(x, y);
    }

    // Scale the position and size of this rectangle by an amount.
    public scale(amount: number): void {
        this.topLeft.scale(amount);
        this.width *= amount;
        this.height *= amount;
    }

    // Calculate the area of this triangle.
    public get area(): number {
        return this.width * this.height;
    }

    // Determine if this rectangle contains a given point.
    public contains(point: Point): boolean {
        return point.x >= this.x &&
            point.y >= this.y &&
            point.x <= this.x + this.width &&
            point.y <= this.y + this.height;
    }

    // Convert this rectangle to a JSON string.
    public toData(): string {
        return `{"x":${this.x},"y":${this.y}` +
            `"width":${this.width},"height":${this.height}}`;
    }

    public toString(): string {
        return `Rectangle{"x": ${this.x}, "y": ${this.y}` +
            `"width": ${this.width}, "height": ${this.height}}`;
    }
}
