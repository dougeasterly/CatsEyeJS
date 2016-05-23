import { buildImageFromURL } from "./load-image";
import Triangle from "./geometry/triangle";
import * as storage from "./storage";

export class ImageData {
    constructor(public name: string,
        public type: string,
        public image: HTMLImageElement) { }
}

// Try and load the last image as a pattern, if such an image exists, passing
// the image's name, type, and loaded pattern to the given callback.
export async function tryReloadLastImage(): Promise<ImageData> {
    const image = storage.fetchLastImage();

    // If an image was present, load it and pass its information to the callback.
    if (image) {
        const pattern = await buildImageFromURL(image.url);
        return new ImageData(image.name, image.type, pattern);
    }

    return null;
}

// Set the initial values of the dimensions if they are in the store.
export function tryReloadLastDimension(element: HTMLInputElement): void {
    // Fetch the last dimension value.
    const value = storage.fetchDimension(element.id);

    // If the value existed, set the element's value.
    if (!isNaN(value)) {
        element.value = String(value);
    }
}

// Try and reload the last selection triangle, bounded by the given image.
export
    function tryReloadLastSelectionTriangle(image: HTMLImageElement): Triangle {
    // Fetch the last triangle information.
    const triangle = storage.fetchSelectionTriangle();

    // Bounds-check the triangle if it exists.
    if (triangle) {
        // If any of the triangle points exceed the bounds of the image, the
        // triangle can't have been for this image so should just be dropped.
        for (let point of triangle) {
            if (point.x < 0 || point.x > image.width ||
                point.y < 0 || point.y > image.height) {
                // The triangle is invalid for the current image: delete it and
                // return null.
                storage.dropSelectionTriangle();
                return null;
            }
        }

        return triangle;
    }

    return null;
}
