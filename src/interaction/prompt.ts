// Prompt the user to select an image, calling the given function if the user
// makes a choice.
export function selectImage(): Promise<File> {
    // Construct a new file selector for images.
    const selector = document.createElement("input");
    selector.type = "file";
    selector.accept = "image/*";

    // Run the callback once a change occurs.
    return new Promise((resolve: (file: File) => void): void => {
        selector.addEventListener("change", function (): void {
            const image = this.files[0];

            // Check if a file was provided. Might be worth checking the type of
            // the file is an image in the future.
            if (image) {
                resolve(image);
            }
        });

        // Simulate a click on the input, triggering the prompt.
        selector.dispatchEvent(new MouseEvent("click"));
    });
}
