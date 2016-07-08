import * as loader from "./load-image";
import * as prompt from "./interaction/prompt";
import Triangle from "./geometry/triangle";
import PatternPreview from "./pattern/preview";
import PatternSave from "./pattern/save";
import Render from "./render";
import * as reload from "./reload";
import Selection from "./selection";
import * as storage from "./storage";

// Set up a given output dimension input.
function setupDimensionInput(element: HTMLInputElement): void {
    // Store the values of the dimensions when they change.
    element.addEventListener("change", (): void => {
        storage.validateAndStoreDimension(element);
    });

    // Load the last used value for this dimension, if possible.
    reload.tryReloadLastDimension(element);
}

// Set up the button events once the page is loaded.
addEventListener("load", (): void => {
    // Set up the preview canvas.
    const preview =
        new PatternPreview(document.getElementById("preview-canvas") as
            HTMLCanvasElement);

    // Set up the selection canvas.
    const selection =
        new Selection(document.getElementById("selection-canvas") as
            HTMLCanvasElement, updatePattern);

    // The cats-eye and saving object is set up when an image is loaded.
    let renderer: Render = null;
    let saver: PatternSave = null;

    // Grab the save interface.
    const saveTileButton =
        document.getElementById("save-tile") as HTMLButtonElement;
    const saveImageButton =
        document.getElementById("save-image") as HTMLButtonElement;
    const saveWidth =
        document.getElementById("save-width") as HTMLInputElement;
    const saveHeight =
        document.getElementById("save-height") as HTMLInputElement;

    // Grab the tile interface.
    const tileScale =
        document.getElementById("tile-scale") as HTMLInputElement;
    const tileReset =
        document.getElementById("tile-reset") as HTMLButtonElement;

    // Grab the toggle grid button.
    const toggleGrid = document.getElementById("toggle-grid");

    // Clicking on a label when the values are set by the corresponding
    // attribute in the element can cause the caret to end up on the wrong side
    // of the number. Setting them here reminds the browser that there are
    // already numbers in the boxes.
    saveWidth.value = saveWidth.value;
    saveHeight.value = saveHeight.value;

    // Perform the dimension input setup for all inputs.
    setupDimensionInput(saveWidth);
    setupDimensionInput(saveHeight);
    setupDimensionInput(tileScale);

    // Initialise the tile size to twice the smallest dimension of the
    // image, and ensure that their values are stored in local storage.
    function resetTileSize(image: HTMLImageElement): void {
        tileScale.value = "100";
        storage.validateAndStoreDimension(tileScale);
    }

    // Update the pattern with the current image and tile dimension values, and
    // redraw the preview canvas.
    function updatePattern(): void {
        const pattern = renderer.makePattern(selection.triangle);

        saver.pattern = pattern;
        preview.pattern = pattern;
    }

    // Set up the preview image and save button from the given image
    // information, and optionally a selection triangle.
    function setupFromImageInfo(name: string,
        type: string,
        image: HTMLImageElement,
        triangle?: Triangle): void {
        // Create a new cats-eye creator for the new image.
        renderer = new Render(image,
            parseInt(tileScale.value, 10) / 100,
            Boolean(toggleGrid.dataset["showing"]));

        // Build a new pattern saver from the image information.
        saver = new PatternSave(name, type);

        // If rendering the image fails, alert the user and trash the current
        // context.
        try {
            // Update the selection canvas with the new image.
            selection.image = image;

            // Move the selection triangle to the position of the given
            // triangle, if present.
            if (triangle) {
                selection.triangle[0].moveTo(triangle[0]);
                selection.triangle[1].moveTo(triangle[1]);
                selection.triangle[2].moveTo(triangle[2]);
            }

            // Create the initial pattern and draw the preview.
            updatePattern();
        } catch (error) {
            // Alert the user.
            alert("Failed to render the image: it might be too big.\n\n" +
                "If the image is large, try resizing it to be smaller " +
                "before loading it.");

            // Forget the context.
            renderer = null;
            saver = null;

            // Disable the interface.
            saveTileButton.disabled = true;
            saveImageButton.disabled = true;
            selection.reset();

            // Drop the storage without forgetting the save image dimensions.
            storage.dropLastImage();
            storage.dropDimension(tileScale.id);

            return;
        }

        // Enable the save buttons.
        saveTileButton.disabled = false;
        saveImageButton.disabled = false;
    }

    // Draw the selection image and preview pattern when the window is
    // resized.
    window.addEventListener("resize", (): void => {
        selection.draw();
        preview.draw();
    });

    function tileScaleChange(): void {
        renderer.scaleFactor = Number(tileScale.value) / 100;
        updatePattern();
    }

    // Update the pattern when the tile size is changed.
    tileScale.addEventListener("change", tileScaleChange);

    // Reset the tile size and update the pattern when the reset button is
    // pressed.
    tileReset.addEventListener("click", (): void => {
        resetTileSize(selection.image);
        tileScaleChange();
    });

    // Save the current tile with this save button is clicked.
    saveTileButton.addEventListener("click", (): void => {
        saver.saveTile();
    });

    // Save the current render when this save button is clicked.
    saveImageButton.addEventListener("click", (): void => {
        saver.saveImage(parseInt(saveWidth.value, 10),
            parseInt(saveHeight.value, 10));
    });

    // Select and load an image when the load image button is clicked.
    document.getElementById("load-image")
        .addEventListener("click", async function () {
            // Prompt for an image.
            const file = await prompt.selectImage();

            // Read the file as a data URL.
            const url = await loader.readImageAsURL(file);

            // Load the image as a pattern and store it if possible.
            const image = await loader.buildImageFromURL(url);

            storage.storeLastImage(file.name, file.type, url);

            // Reset the tile and triangle selection size for the new image.
            resetTileSize(image);
            storage.dropSelectionTriangle();

            // Set up the selection, preview and save button from the image
            // information.
            setupFromImageInfo(file.name, file.type, image);
        });

    function showGrid(): void {
        toggleGrid.dataset["showing"] = "showing";
        toggleGrid.innerText = "Hide Grid";
        storage.storeShowGrid(true);

        if (renderer) {
            renderer.showGrid = true;
            updatePattern();
        }
    }

    function hideGrid(): void {
        delete toggleGrid.dataset["showing"];
        toggleGrid.innerText = "Show Grid";
        storage.storeShowGrid(false);

        if (renderer) {
            renderer.showGrid = false;
            updatePattern();
        }
    }

    // Set the stored show grid setting, which defaults to false.
    if (storage.fetchShowGrid()) {
        showGrid();
    } else {
        hideGrid();
    }

    // Toggle the show grid setting when the toggle button is clicked.
    toggleGrid.addEventListener("click", (): void => {
        if (toggleGrid.dataset["showing"]) {
            hideGrid();
        } else {
            showGrid();
        }
    });

    reload.tryReloadLastImage().then((data: reload.ImageData): void => {
        if (data) {
            setupFromImageInfo(data.name,
                data.type,
                data.image,
                reload.tryReloadLastSelectionTriangle(data.image));
        }
    });
});

// Set up dimension groups appearing on mouse hover.
function setupAuxiliaryGroup(group: HTMLElement, auxiliary: HTMLElement): void {
    let timeout: number;

    // Have the dimension inputs appear when the group surrounding both is
    // hovered over.
    group.addEventListener("mouseover", (): void => {
        clearTimeout(timeout);
        auxiliary.style.transitionProperty = "none";
        auxiliary.style.opacity = "1";
        auxiliary.style.display = "inline-block";
    });

    // Have the auxiliary inputs disappear over a second, and finally no longer
    // be displayed. The fade functionality is defined in the accompanying CSS.
    group.addEventListener("mouseout", (): void => {
        auxiliary.style.transitionProperty = "opacity";
        auxiliary.style.opacity = "0";
        timeout = setTimeout((): void => {
            auxiliary.style.display = "none";
        }, 1000);
    });
}

// Set up the save dimension interface.
addEventListener("load", (): void => {
    // Fetch the groups around the elements.
    const saveGroup = document.getElementById("save-image-group");
    const saveAuxiliary = document.getElementById("save-auxiliary");
    const tileGroup = document.getElementById("tile-group");
    const tileAuxiliary = document.getElementById("tile-auxiliary");

    // Setup the dimension group events.
    setupAuxiliaryGroup(saveGroup, saveAuxiliary);
    setupAuxiliaryGroup(tileGroup, tileAuxiliary);
});
