import Triangle from "../geometry/triangle";

// Try and save the given selection triangle in the persistent store. Does
// nothing if the local storage is not supported by the platform, or no image
// has been stored there.
export function storeSelectionTriangle(triangle: Triangle): void {
    // Check if localStorage is available, failing silently otherwise or if the
    // store causes an error: if this is failing, the user will probably have
    // already encountered the error when loading the image.
    try {
        if (typeof localStorage === "object" && localStorage["image"]) {
            // Save the information as a JSON string. The triangle will
            // naturally render the appropriate elements.
            localStorage["selectionTriangle"] = triangle.toData();
        }
    } catch (error) { }
}

// Try to fetch the stored selection triangle properties as a record
// object. Returns null if no value has been saved or if local storage is not
// supported by the platform.
export function fetchSelectionTriangle(): Triangle {
    // Check if localStorage is available, and if a triangle has been stored.
    if (typeof localStorage === "object" && localStorage["selectionTriangle"]) {
        try {
            // Attempt to parse the saved image.
            return Triangle
                .fromData(JSON.parse(localStorage["selectionTriangle"]));
        } catch (error) {
            // If the parsing failed, the information can't be used and should
            // just be deleted.
            delete localStorage["selectionTriangle"];
            return null;
        }
    }

    return null;
}

// Drop any stored selection triangle from the persistent storage.
export function dropSelectionTriangle(): void {
    // Check if localStorage is available.
    if (typeof localStorage === "object") {
        delete localStorage["selectionTriangle"];
    }
}
