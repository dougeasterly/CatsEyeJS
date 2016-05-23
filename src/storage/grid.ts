// Try and save the given show grid setting. Does nothing if the local storage
// is not supported by the platform, or no image has been stored there.
export function storeShowGrid(value: boolean): void {
    // Check if localStorage is available, failing silently otherwise or if the
    // store causes an error: if this is failing, the user will probably have
    // already encountered the error when loading the image.
    try {
        if (typeof localStorage === "object" && localStorage["image"]) {
            // Store true if the value should be set, and delete it otherwise.
            if (value) {
                localStorage["showGrid"] = true;
            } else {
                delete localStorage["showGrid"];
            }
        }
    } catch (error) {}
}

// Try to fetch the stored show grid setting. Defaults to false if no value has
// been saved or if local storage is not supported by the platform.
export function fetchShowGrid(): boolean {
    if (typeof localStorage === "object" && localStorage["showGrid"]) {
        return Boolean(localStorage["showGrid"]);
    }

    return false;
}
