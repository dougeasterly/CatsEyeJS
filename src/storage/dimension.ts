// Try and save the given dimension value in the persistent store for the given
// name. Does nothing if local storage is not supported by the platform.
export function storeDimension(name: string, value: number): void {
    // Check if localStorage is available, failing silently otherwise or if the
    // store causes an error: if this is failing, the user will probably have
    // already encountered the error when loading the image.
    try {
        if (typeof localStorage === "object" && localStorage["image"]) {
            localStorage[name] = value;
        }
    } catch (error) {}
}

// Try to fetch the stored value for the given dimension. Returns NaN if no
// value has been saved or if local storage is not supported by the platform.
export function fetchDimension(name: string): number {
    // Check if localStorage is available, and if a dimension has been stored.
    if (typeof localStorage === "object" && localStorage[name]) {
        // Attempt to parse the dimension value. If this fails, it returns NaN.
        return parseInt(localStorage[name], 10);
    }

    return NaN;
}

// Validate the value of a dimension element and store the resulting value in
// the store if possible.
export function validateAndStoreDimension(element: HTMLInputElement): void {
    // If the value is too small, use the minimum. Either way, force the value
    // to be an integer.
    const value = parseInt(element.value < element.min ?
                           element.min : element.value, 10);

    // Set the input's value.
    element.value = String(value);

    // Store the value in persistent storage.
    storeDimension(element.id, value);
}

// Drop the dimension of the given name from local storage. Does nothing if no
// such dimension is stored, or if local storage is not supported by the
// platform.
export function dropDimension(name: string): void {
    // Check if localStorage is available, and if a dimension has been stored.
    if (typeof localStorage === "object" && localStorage[name]) {
        delete localStorage[name];
    }
}
