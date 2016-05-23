import Point from "./point";
import Rectangle from "./rectangle";
import DataError from "../error/data";

// Mutable triangle objects.
export default class Triangle {
    public 0: Point;
    public 1: Point;
    public 2: Point;

    constructor(a: Point, b: Point, c: Point) {
        this[0] = a;
        this[1] = b;
        this[2] = c;
    }

    // Construct a triangle from an object containing three points.
    public static fromData(data: any): Triangle {
        if (!data[0] || !data[1] || !data[2]) {
            throw new DataError("Triangle", "must have 3 points");
        }

        return new Triangle(Point.fromData(data[0]),
            Point.fromData(data[1]),
            Point.fromData(data[2]))
    }

    public *[Symbol.iterator](): Iterator<Point> {
        yield this[0];
        yield this[1];
        yield this[2];
    }

    // Create a copy of this triangle.
    public copy(): Triangle {
        return new Triangle(this[0], this[1], this[2]);
    }

    // Translate the position of this point in both directions by an amount.
    public move(amount: number): void {
        this[0].move(amount);
        this[1].move(amount);
        this[2].move(amount);
    }

    // Translate the position of this point by an x and y amount.
    public translate(x: number, y: number): void {
        this[0].translate(x, y);
        this[1].translate(x, y);
        this[2].translate(x, y);
    }

    // Scale the position and size of this point by an amount.
    public scale(amount: number): void {
        this[0].scale(amount);
        this[1].scale(amount);
        this[2].scale(amount);
    }

    // Calculate the signed area of this triangle.
    public get area(): number {
        return 1 / 2 * (-this[1].y * this[2].x + this[0].y *
            (-this[1].x + this[2].x) + this[0].x *
            (this[1].y - this[2].y) + this[1].x * this[2].y);
    }

    // Determine if this triangle contains a given point.
    public contains(point: Point): boolean {
        const a = this.area;
        const s = 1 / (2 * a) * (this[0].y * this[2].x - this[0].x * this[2].y +
            (this[2].y - this[0].y) * point.x +
            (this[0].x - this[2].x) * point.y);
        const t = 1 / (2 * a) * (this[0].x * this[1].y - this[0].y * this[1].x +
            (this[0].y - this[1].y) * point.x +
            (this[1].x - this[0].x) * point.y);

        return 0 <= s && s <= 1 && 0 <= t && t <= 1 && s + t <= 1;
    }

    // Calculate the bounding rectangle of this triangle.
    public get boundingRectangle(): Rectangle {
        const x = Math.min(this[0].x, this[1].x, this[2].x);
        const y = Math.min(this[0].y, this[1].y, this[2].y);

        const right = Math.max(this[0].x, this[1].x, this[2].x);
        const bottom = Math.max(this[0].y, this[1].y, this[2].y);

        return new Rectangle(x, y, right - x, bottom - y);
    }

    // Convert this triangle to a JSON string.
    public toData(): string {
        return `[${this[0].toData()},${this[1].toData()},${this[2].toData()}]`;
    }

    public toString(): string {
        return `Triangle[${this[0]}, ${this[1]}, ${this[2]}]`;
    }
}
