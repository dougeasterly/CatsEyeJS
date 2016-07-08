import DataError from "../error/data"

// Mutable point objects.
export default class Point {
    constructor(public x: number, public y: number) { }

    // Construct a point from an object containing x and y coordinates.
    public static fromData(data: any): Point {
        if (typeof data.x !== "number" || typeof data.y !== "number") {
            throw new DataError("Point", "x and y must be numbers");
        }

        return new Point(data.x, data.y);
    }

    // Create a copy of this point.
    public copy(): Point {
        return new Point(this.x, this.y);
    }

    // Translate the position of this point in both directions by an amount.
    public move(amount: number): void {
        this.translate(amount, amount);
    }

    // Move this point to the given point.
    public moveTo(point: Point): void {
        this.x = point.x;
        this.y = point.y;
    }

    // Translate the position of this point by an x and y amount.
    public translate(x: number, y: number): void {
        this.x += x;
        this.y += y;
    }

    // Scale the position of this point by an amount.
    public scale(amount: number): void {
        this.x *= amount;
        this.y *= amount;
    }

    // Calculate the distance to another point.
    public distanceTo(point: Point): number {
        return Math.sqrt(Math.pow(this.x - point.x, 2) +
            Math.pow(this.y - point.y, 2));
    }

    // Calculate the offset from this point to another point as a vector.
    public offsetFrom(point: Point): Point {
        return new Point(this.x - point.x,
            this.y - point.y);
    }

    // Convert this point to a JSON string.
    public toData(): string {
        return `{"x":${this.x},"y":${this.y}}`;
    }

    public toString(): string {
        return `(${this.x}, ${this.y})`;
    }
}
