import PatternDraw from "./draw";

// An object which creates a temporary canvas to render the given pattern on and
// return the render as a data URL.
export default class PatternSave extends PatternDraw {
    constructor(private name: string, private type: string) {
        super(document.createElement("canvas"));
    }

    // Render an image of this object's pattern with the given dimensions.
    public renderToDataURL(width: number, height: number): string {
        // Resize the canvas to the given width and height.
        this.canvas.width = width;
        this.canvas.height = height;

        // Draw on the canvas, then construct the corresponding data URL.
        this.drawPattern();
        return this.canvas.toDataURL(this.type);
    }

    // Perform the save of this object's pattern as a download, rendered to an
    // image of the given dimensions.
    public saveImage(width: number, height: number): void {
        // Construct a link to simulate a click on.
        const link = document.createElement("a") as
            HTMLAnchorElement & { download: string };

        // Set the properties of the link from the given information, and
        // dispatch a click to the link to trigger the download.
        link.download = "catseye-" + width + "x" + height + "-" + this.name;
        link.href = this.renderToDataURL(width, height);
        link.dispatchEvent(new MouseEvent("click"));
    }

    // Perform an image save as above, but use the width and height of the tile.
    public saveTile(): void {
        this.saveImage(this.pattern.width, this.pattern.height);
    }
}
