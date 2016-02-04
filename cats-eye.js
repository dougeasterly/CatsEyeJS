"use strict";

// Draw a triangle clipping of the image.
//
// Note that we have to overcompensate on the edges of the hypotenuse,
// otherwise the rendering in some browsers can leave a layout pixel blank
// between the eventual rotations.
function drawTriangle(image, context, size) {
  context.save();
  context.beginPath();
  context.moveTo(-0.5, 0);
  context.lineTo(size, 0);
  context.lineTo(size, size + 0.5);
  context.lineTo(-0.5, 0);
  context.clip();
  context.drawImage(image, 0, 0, size, size);
  context.restore();
}

// Draw multiple triangles of the given image to make the full pattern.
function drawTriangles(image, context, size) {
  var i, j;

  for (i = 0; i < 4; i += 1) {
    for (j = 0; j < 2; j += 1) {
      // Draw a triangle and its reflection.
      context.scale(1, -1);
      drawTriangle(image, context, size);
    }

    // Draw the inner loop at each of 4 rotation points around the origin.
    context.rotate(Math.PI / 2);
  }
}

// Make a single render on a new canvas from the given image, to be repeated as
// a pattern.
function makePattern(image) {
  var canvas, context, size;

  // Create the canvas to draw the pattern on.
  canvas = document.createElement("canvas");

  // Get the size of the image's smallest dimension.
  size = Math.min(image.width, image.height);

  // Make the canvas a square with edges of length twice the size of the image,
  // given that the image will be drawn twice in both dimensions.
  canvas.width = canvas.height = size * 2;

  // Grab the context, and move the origin into the middle of the canvas.
  context = canvas.getContext("2d");
  context.translate(size, size);

  // Draw the pattern.
  drawTriangles(image, context, size);

  return canvas;
}

// Draw the pattern onto the given canvas.
function drawPattern(canvas, pattern) {
  var context, height, repeated, width;

  // Grab the context of the canvas, and repeat the pattern in the context.
  context = canvas.getContext("2d");
  repeated = context.createPattern(pattern, "repeat");

  // Fetch the width and height of the canvas.
  width = canvas.width;
  height = canvas.height;

  // Move the origin to the center of the canvas, and then draw a rectangle from
  // back at the top left corner to the size of the large canvas. Fill the
  // rectangle with the repeating pattern of the smaller canvas.
  context.translate(width / 2, height / 2);
  context.rect(-width / 2, -height / 2, width, height);
  context.fillStyle = repeated;
  context.fill();
}

// Draw the pattern onto the given canvas, resizing it to fill its container.
function drawPreview(canvas, pattern) {
  // Fetch the container of the canvas.
  var container = canvas.parentNode;

  // Set the size of the canvas to 0, to allow the container to return to its
  // natural size.
  canvas.width = 0;
  canvas.height = 0;

  // Set the size of the preview canvas to the size of the container.
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  // Draw the pattern on the preview canvas.
  drawPattern(canvas, pattern);
}

// Draw the pattern on a new canvas of the given width and height for output,
// and return the resulting canvas.
function drawOutput(pattern, width, height) {
  // Construct a canvas with the given width and height.
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  // Draw the pattern on the new canvas.
  drawPattern(canvas, pattern);

  return canvas;
}

// Prompt the user to select an image, calling the given function if the user
// makes a choice.
function selectImage(callback) {
  // Construct a new file selector for images.
  var selector = document.createElement("input");
  selector.type = "file";
  selector.accept = "image/*";

  // Run the callback once a change occurs.
  selector.onchange = function () {
    var image = this.files[0];

    // Check if a file was provided. Might be worth checking the type of the
    // file is an image in the future.
    if (image) {
      callback(image);
    }
  };

  // Simulate a click on the input, triggering the prompt.
  selector.dispatchEvent(new MouseEvent("click"));
}

// Read the given image file as a data URL, calling the given function if this
// is successful.
function readImageAsURL(file, callback) {
  var reader = new FileReader();

  // Run the callback once the file is successfully loaded. There should
  // probably be an error handler here as well.
  reader.onload = function () {
    callback(this.result);
  };

  // Read the file as a URL.
  reader.readAsDataURL(file);
}

// Load the image at the given URL, passing the resulting image to the
// callback once the load completes.
function loadImageAsElement(url, callback) {
  var image = document.createElement("img");

  // Just run the callback with the image once the load completes.
  image.onload = function () {
    callback(this);
  };

  // Trigger the load.
  image.src = url;
}

// Load the image at the given URL and build a pattern from it.
function patternFromURL(url, callback) {
  // Load the URL into an image.
  loadImageAsElement(url, function (image) {
    // Make a pattern of the image and pass it to the callback.
    callback(makePattern(image));
  });
}

// Try and save the given data about an image in the persistent store as the
// most recent image to be loaded. Does nothing if local storage is not
// supported by the platform.
function storeLastImage(name, type, url) {
  // Check if localStorage is available.
  if (typeof localStorage === "object") {
    // Save the information as a JSON string.
    localStorage.image = JSON.stringify({
      "name": name,
      "type": type,
      "url": url
    });
  }
}

// Try to fetch data about the most recent image. Returns null if no image has
// been saved of if local storage is not supported by the platform.
function fetchLastImage() {
  // Check if localStorage is available, and if an image has been saved.
  if (typeof localStorage === "object" && localStorage.image) {
    try {
      // Attempt to parse the saved image.
      return JSON.parse(localStorage.image);
    } catch (error) {
      // If the parsing failed, the information can't be used and should just
      // be deleted.
      delete localStorage.image;
      return null;
    }
  }

  return null;
}

// Read, store, and return an image file as a pattern to the given callback.
function loadAndStoreFromFile(file, callback) {
  // Read the selected file as a URL.
  readImageAsURL(file, function (url) {
    // Store the selected and read file's information.
    storeLastImage(file.name, file.type, url);

    // Construct the pattern from the resulting URL.
    patternFromURL(url, callback);
  });
}

// Try and save the given dimension value in the persistent store for the given
// name. Does nothing if local storage is not supported by the platform.
function storeDimension(name, value) {
  // Check if localStorage is available.
  if (typeof localStorage === "object") {
    localStorage[name] = value;
  }
}

// Try to fetch the stored value for the given dimension. Returns NaN if no
// value has been saved of if local storage is not supported by the platform.
function fetchDimension(name) {
  // Check if localStorage is available, and if a dimension has been stored.
  if (typeof localStorage === "object" && localStorage[name]) {
    // Attempt to parse the dimension value. If this fails, it returns NaN.
    return parseInt(localStorage[name], 10);
  }

  return NaN;
}

// Validate the value of a dimension element and store the resulting value in
// the store if possible.
function validateAndStoreDimension(element) {
  if (element.value < element.min) {
    // If the value is too small, set it back to the minimum.
    element.value = element.min;
  } else {
    // Force the value to be an integer.
    element.value = Math.floor(element.value);
  }

  // Store the value in persistent storage.
  storeDimension(element.dataset.dimension, element.value);
}

// Set up the preview canvas with the given pattern.
function previewPattern(canvas, pattern) {
  // When the window is resized, resize the canvas to fill the new screen
  // size, and preview the resulting pattern now.
  (window.onresize = function () {
    drawPreview(canvas, pattern);
  })();
}

// Trigger a save of the given canvas as an image download with the given name
// and media type.
function saveCanvas(name, type, canvas) {
  // Construct a link to simulate a click on.
  var link = document.createElement("a");

  // Calculate the name and type of the output file from the input, and
  // trigger the save.
  link.download = name;
  link.href = canvas.toDataURL(type);
  link.dispatchEvent(new MouseEvent("click"));
}

// Render and download the currently loaded pattern.
function saveImage(name, type, pattern, width, height) {
  var canvas;

  // Draw and save the output.
  canvas = drawOutput(pattern, width, height);
  saveCanvas(name, type, canvas);
}

// Enable the save button and hook up its click event to the given callback.
function enableSaveButton(saveButton, callback) {
  // Enable the save button, and trigger a save when it is clicked.
  saveButton.disabled = false;
  saveButton.onclick = callback;
}

// Try and load the last image as a pattern, if such an image exists, passing
// the image's name, type, and loaded pattern to the given callback.
function tryReloadLastImage(callback) {
  var image = fetchLastImage();

  // If an image was present, load it and pass its information to the callback.
  if (image !== null) {
    patternFromURL(image.url, function (pattern) {
      callback(image.name, image.type, pattern);
    });
  }
}

// Set the initial values of the dimensions if they are in the store.
function tryReloadLastDimension(element) {
  // Fetch the last dimension value.
  var value = fetchDimension(element.dataset.dimension);

  // If the value existed, set the element's value.
  if (!isNaN(value)) {
    element.value = value;
  }
}

// Set up the button events once the page is loaded.
window.addEventListener("load", function () {
  var canvas, height, saveButton, width;

  // Retrieve the appropriate elements from the page.
  canvas = document.getElementById("preview-canvas");
  saveButton = document.getElementById("save-image");
  width = document.getElementById("save-width");
  height = document.getElementById("save-height");

  // Clicking on a label when the values are set by the corresponding attribute
  // in the element can cause the caret to end up on the wrong side of the
  // number. Setting them here reminds the browser that there are already
  // numbers in the boxes.
  width.value = width.value;
  height.value = height.value;

  // Set up a given output dimension input.
  function setupDimensionInput(element) {
    // Store the values of the dimensions when they change.
    element.onchange = function () {
      validateAndStoreDimension(element);
    };

    // Load the last used value for this dimension, if possible.
    tryReloadLastDimension(element);
  }

  // Perform the dimension input setup for both inputs.
  setupDimensionInput(width);
  setupDimensionInput(height);

  // Set up the preview image and save button from the given image information.
  function setupFromImageInfo(name, type, pattern) {
    // Preview the resulting pattern.
    previewPattern(canvas, pattern);

    // Enable the save button.
    enableSaveButton(saveButton, function () {
      // Save the image.
      saveImage("cats-eye-" + name, type, pattern, width.value, height.value);
    });
  }

  // Select and load an image when the load image button is clicked.
  document.getElementById("load-image").onclick = function () {
    // Prompt for an image.
    selectImage(function (file) {
      // Load the image as a pattern and store it if possible.
      loadAndStoreFromFile(file, function (pattern) {
        // Set up the preview and save button from the image information.
        setupFromImageInfo(file.name, file.type, pattern);
      });
    });
  };

  // Load the last used image, if possible.
  tryReloadLastImage(setupFromImageInfo);
});

// Set up the save dimension interface.
window.addEventListener("load", function () {
  var dimensions, saveGroup, timeout;

  // Fetch the groups around the elements.
  saveGroup = document.getElementById("save-group");
  dimensions = document.getElementById("save-dimensions");

  // Have the save dimension inputs appear when the group surrounding both is
  // hovered over.
  saveGroup.onmouseover = function () {
    clearTimeout(timeout);
    dimensions.style.transitionProperty = "none";
    dimensions.style.opacity = 1;
    dimensions.style.display = "inline-block";
  };

  // Have the save dimension inputs disappear over a second, and finally no
  // longer be displayed.
  saveGroup.onmouseout = function () {
    dimensions.style.transitionProperty = "opacity";
    dimensions.style.opacity = 0;
    timeout = setTimeout(function () {
      dimensions.style.display = "none";
    }, 1000);
  };
});
