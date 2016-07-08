export interface ImageData {
    name: string;
    type: string;
    url: string;
}

// Try and save the given data about an image in the persistent store as the
// most recent image to be loaded. Alerts the user if local storage is not
// supported by the platform or the image is too big.
export function storeLastImage(name: string, type: string, url: string): void {
    try {
        if (typeof localStorage === "object") {
            // Remove the old image, in case the storage fails.
            delete localStorage["image"];

            // Save the information as a JSON string.
            localStorage["image"] = JSON.stringify({
                "name": name,
                "type": type,
                "url": url
            });
        } else {
            alert("Failed to store the image: " +
                "your browser doesn't support local storage.\n\n" +
                "You can continue as normal, but be aware that your work " +
                "will not be saved if the page is closed.");
        }
    } catch (error) {
        alert("Failed to store the image: it's probably too big.\n\n" +
            "You can continue as normal, but be aware that your work " +
            "will not be saved if the page is closed.");
    }
}

// Try to fetch data about the most recent image. Returns null if no image has
// been saved or if local storage is not supported by the platform.
export function fetchLastImage(): ImageData {
    // Check if localStorage is available, and if an image has been saved.
    if (typeof localStorage === "object" && localStorage["image"]) {
        try {
            // Attempt to parse the saved image.
            return JSON.parse(localStorage["image"]) as ImageData;
        } catch (error) {
            // If the parsing failed, the information can't be used and should
            // just be deleted.
            delete localStorage["image"];
            return null;
        }
    }

    return null;
}

// Drop the last image from local storage. Does nothing if no image has been
// saved or if local storage is not supported by the platform.
export function dropLastImage(): void {
    // Check if localStorage is available, and if an image has been saved.
    if (typeof localStorage === "object" && localStorage["image"]) {
        delete localStorage["image"];
    }
}
