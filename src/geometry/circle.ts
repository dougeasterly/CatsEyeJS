import Point from "./point";
import DataError from "../error/data"

// Mutable circle objects.
export default class Circle extends Point {
    constructor(x: number, y: number, public radius: number) {
        super(x, y);
    }

    // Construct a circle from an object containing point data and a radius.
    public static fromData(data: any): Circle {
        if (typeof data.x !== "number" ||
            typeof data.y !== "number" ||
            typeof data.radius !== "number") {
            throw new DataError("Circle", "x, y, and radius must be a number");
        }

        return new Circle(data.x, data.y, data.radius);
    }

    // Create a copy of this circle.
    public copy(): Circle {
        return new Circle(this.x, this.y, this.radius);
    }

    // Scale the position and radius of this point by an amount.
    public scale(amount: number): void {
        super.scale(amount);
        this.radius *= amount;
    }

    // Calculate the area of this circle.
    public get area(): number {
        return Math.PI * Math.pow(this.radius, 2);
    }

    // Determine if this circle contains a given point.
    public contains(point: Point): boolean {
        return this.distanceTo(point) <= this.radius;
    }

    // Convert this circle to a JSON string.
    public toData(): string {
        return `{"x":${this.x},"y":${this.y},"radius":${this.radius}}`;
    }

    public toString(): string {
        return `Circle{"center": ${super.toString()}, ` +
            `"radius": ${this.radius}}`;
    }
}
