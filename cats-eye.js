"use strict";

// Construct a fresh prototype from the given constructor without invoking the
// constructor itself.
function Inherit(Super) {
  var Clone = function () {};
  Clone.prototype = Super.prototype;
  return new Clone();
}


// A point in two-dimensional space.
function Point(x, y) {
  this.x = x;
  this.y = y;
}

// Construct a new point by scaling this point's values.
Point.prototype.scaled = function (scale) {
  return new Point(this.x * scale, this.y * scale);
};


// A triangle represented by three points.
function Triangle(a, b, c) {
  this[0] = a;
  this[1] = b;
  this[2] = c;
};

// Construct a new triangle by sclaing this triangle's points.
Triangle.prototype.scaled = function (scale) {
  return new Triangle(this[0].scaled(scale),
                      this[1].scaled(scale),
                      this[2].scaled(scale));
};

// Construct a new triangle by making the larger straight side the same length
// as the smaller side.
Triangle.prototype.squared = function () {
  var size = Math.min(this[2].x, this[2].y);

  return new Triangle(new Point(0, 0),
                      new Point(size, 0),
                      new Point(size, size));
};


// The abstract class of objects which have a canvas to draw a triangle path on.
function TrianglePathing(context) {
  this.context = context;
}

// Create a triangle path on the given context of the given size.
//
// Note that we should be overcompensating on the edges of the hypotenuse,
// otherwise the rendering in some browsers can leave a layout pixel blank
// between the eventual rotations.
TrianglePathing.prototype.pathTriangle = function (triangle) {
  this.context.beginPath();
  this.context.moveTo(triangle[0].x, triangle[0].y);
  this.context.lineTo(triangle[1].x, triangle[1].y);
  this.context.lineTo(triangle[2].x, triangle[2].y);
  this.context.lineTo(triangle[0].x, triangle[0].y);
  this.context.closePath();
};


// A box for selecting a portion of an image to cats-eye.
function Selection(canvas) {
  TrianglePathing.call(this, canvas.getContext("2d"));

  this.canvas = canvas;

  this.image = null;
  this.triangle = null;
}

Selection.prototype = Inherit(TrianglePathing);

// A fixed size for the radius of each selector point.
Selection.pointRadius = 7;

// Set the image and reset the selection points.
Selection.prototype.setImage = function (image) {
  var size = Math.min(image.width, image.height);

  // Save the image and reset the triangle to the dimensions of the image.
  this.image = image;
  this.triangle = new Triangle(new Point(0, 0),
                               new Point(image.width, 0),
                               new Point(image.width, image.height));

  // Redraw the selection.
  this.draw();
};

// Work out an appropriate scale for the selector based on the ratio of the
// image size to the size of the document.
Selection.prototype.calculateScale = function () {
  var html, scale;

  // Fetch the document element so we can examine its size in comparison to the
  // image, to ensure the selection preview doesn't take up too much space.
  html = document.documentElement;

  // Start with a scale of 1:1.
  scale = 1;

  // If the width of the image exceeds a quarter of the display, shrink the
  // width to that quarter and the height to match.
  if (this.image.width > html.offsetWidth / 4) {
    scale = html.offsetWidth / 4 / this.image.width;
  }

  // Whether or not the height has been shrunk, if the height of the image still
  // exceeds a quarter of the display, shrink the height to that quarter and the
  // width to match. As this process can only make the width smaller, it does
  // not invalidate the shrinking above.
  if (this.image.height * scale > html.offsetHeight / 4) {
    scale = html.offsetHeight / 4 / this.image.height;
  }

  return scale;
};

// Draw a circle on the given context at a position and with a radius.
//
// Set the fill-style beforehand to modify how the circle is drawn.
Selection.prototype.drawCircle = function (point, radius) {
  var context = this.canvas.getContext("2d");

  context.beginPath();
  context.arc(point.x, point.y, radius, 0, 2 * Math.PI);
  context.closePath();
  context.fill();
};

// Draw the selection on its canvas by rendering its image and then the triangle
// selector at its current points. The selector will scale to ensure it does not
// take up too much of the document.
Selection.prototype.draw = function () {
  var context, height, scale, triangle, width;

  // Fetch the context and prepare to render to it without modifying the state
  // once the function ends.
  context = this.canvas.getContext("2d");
  context.save();

  // Fetch the size of the original image, and scale it based on the size of the
  // document.
  scale = this.calculateScale();
  width = this.image.width * scale;
  height = this.image.height * scale;

  // Fetch and scale the points of the triangle selector.
  triangle = this.triangle.scaled(scale);

  // Resize the canvas to the size of the image, leaving room for the radius of
  // each triangle corner.
  this.canvas.width = width + Selection.pointRadius * 2 + 2;
  this.canvas.height = height + Selection.pointRadius * 2 + 2;

  // Move the origin to take the extra radius room into account.
  context.translate(Selection.pointRadius + 1, Selection.pointRadius + 1);

  // Draw the image on the canvas.
  context.drawImage(this.image, 0, 0, width, height);

  // Draw the selection triangle over the top of the image.
  context.strokeStyle = "black";
  context.lineWidth = 2;
  this.pathTriangle(triangle);
  context.stroke();

  // Draw large circles on the each of the corners of the triangle.
  context.fillStyle = "red";
  this.drawCircle(triangle[0], Selection.pointRadius);
  this.drawCircle(triangle[1], Selection.pointRadius);
  this.drawCircle(triangle[2], Selection.pointRadius);

  // Restore the context state before exiting.
  context.restore();

  // Show the canvas if it was hidden.
  this.canvas.parentNode.style.display = "block";
};


// An object to draw a cats-eye pattern.
function CatsEye(image, size) {
  this.canvas = document.createElement("canvas");

  TrianglePathing.call(this, this.canvas.getContext("2d"));

  this.image = image;
  this.size = size;
}

CatsEye.prototype = Inherit(TrianglePathing);

// Set the size of the cats-eye effect to the given size.
CatsEye.prototype.setSize = function (size) {
  this.size = size;
};

// Draw a triangle clipping of the image.
CatsEye.prototype.clipTriangle = function (triangle) {
  var context = this.canvas.getContext("2d");

  context.save();
  this.pathTriangle(triangle);
  context.clip();
  context.drawImage(this.image, 0, 0, this.size, this.size);
  context.restore();
};

// Draw multiple triangles of the given image to make the full pattern.
CatsEye.prototype.clipTriangles = function (triangle) {
  var context, i, j;

  context = this.canvas.getContext("2d");

  for (i = 0; i < 4; i += 1) {
    for (j = 0; j < 2; j += 1) {
      // Draw a triangle and its reflection.
      context.scale(1, -1);
      this.clipTriangle(triangle);
    }

    // Draw the inner loop at each of 4 rotation points around the origin.
    context.rotate(Math.PI / 2);
  }
};

// Make a single render on a new canvas from the given image, to be repeated as
// a pattern. The size indicates the length of each dimension of the resulting
// canvas.
CatsEye.prototype.makePattern = function (triangle) {
  // Make the canvas a square with edges of length twice the size of the image,
  // given that the image will be drawn twice in both dimensions.
  this.canvas.width = this.canvas.height = this.size * 2;

  // Move the origin into the middle of the canvas.
  this.canvas.getContext("2d").translate(this.size, this.size);

  // Draw the pattern and return the canvas.
  this.clipTriangles(triangle);
  return this.canvas;
};


// The abstract super class of objects with a canvas to draw a pattern on.
function PatternDraw(canvas) {
  this.canvas = canvas;
  this.pattern = null;
}

// Draw the pattern onto the given canvas.
PatternDraw.prototype.drawPattern = function () {
  var context, height, pattern, width;

  // Grab the context of the canvas, and repeat the pattern in the context.
  context = this.canvas.getContext("2d");
  pattern = context.createPattern(this.pattern, "repeat");

  // Fetch the width and height of the canvas.
  width = this.canvas.width;
  height = this.canvas.height;

  // Move the origin to the center of the canvas, and then draw a rectangle from
  // back at the top left corner to the size of the large canvas. Fill the
  // rectangle with the repeating pattern of the smaller canvas.
  context.translate(width / 2, height / 2);
  context.rect(-width / 2, -height / 2, width, height);
  context.fillStyle = pattern;
  context.fill();
};


// An object which creates a temporary canvas to render the given pattern on and
// return the render as a data URL.
function PatternSaver(name, type) {
  PatternDraw.call(this, document.createElement("canvas"));

  this.name = name;
  this.type = type;
  this.pattern = null;
}

PatternSaver.prototype = Inherit(PatternDraw);

// Set the properties of the save: download name, image type, and the pattern
// itself.
PatternSaver.prototype.setPattern = function (pattern) {
  this.pattern = pattern;
};

// Render an image of this object's pattern with the given dimensions.
PatternSaver.prototype.renderToDataURL = function (width, height) {
  // Resize the canvas to the given width and height.
  this.canvas.width = width;
  this.canvas.height = height;

  // Draw on the canvas, then construct the corresponding data URL.
  this.drawPattern();
  return this.canvas.toDataURL(this.type);
};

// Perform the save of this object's pattern, rendered to an image of the given
// dimensions.
PatternSaver.prototype.save = function (width, height) {
  // Construct a link to simulate a click on.
  var link = document.createElement("a");

  // Set the properties of the link from the given information, and dispatch a
  // click to the link to trigger the download.
  link.download = "cats-eye-" + this.name;
  link.href = this.renderToDataURL(width, height);
  link.dispatchEvent(new MouseEvent("click"));
};


// A preview of the current cats-eye render.
function PatternPreview(canvas) {
  PatternDraw.call(this, canvas, null);
};

PatternPreview.prototype = Inherit(PatternDraw);

// Set the pattern for this object, and redraw the preview.
PatternPreview.prototype.setPattern = function (pattern) {
  this.pattern = pattern;
  this.draw();
};

// Draw the preview render, resizing the canvas to fill its container.
PatternPreview.prototype.draw = function () {
  // Fetch the container of the canvas.
  var container = this.canvas.parentNode;

  // Set the size of the canvas to 0, to allow the container to return to its
  // natural size.
  this.canvas.width = 0;
  this.canvas.height = 0;

  // Set the size of the preview canvas to the size of the container.
  this.canvas.width = container.offsetWidth;
  this.canvas.height = container.offsetHeight;

  // Draw the pattern on the preview canvas.
  this.drawPattern();
};


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
function buildImageFromURL(url, callback) {
  var image = document.createElement("img");

  // Just run the callback with the image once the load completes.
  image.onload = function () {
    callback(this);
  };

  // Trigger the load.
  image.src = url;
}

// Read, store, and return the given image as an element to the given callback.
function buildAndStoreImageFromFile(file, callback) {
  // Read the selected file as a URL.
  readImageAsURL(file, function (url) {
    // Store the selected and read file's information.
    storeLastImage(file.name, file.type, url);

    // Construct the image element from the resulting URL.
    buildImageFromURL(url, callback);
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
  storeDimension(element.id, element.value);
}

// Try and load the last image as a pattern, if such an image exists, passing
// the image's name, type, and loaded pattern to the given callback.
function tryReloadLastImage(callback) {
  var image = fetchLastImage();

  // If an image was present, load it and pass its information to the callback.
  if (image !== null) {
    buildImageFromURL(image.url, function (pattern) {
      callback(image.name, image.type, pattern);
    });
  }
}

// Set the initial values of the dimensions if they are in the store.
function tryReloadLastDimension(element) {
  // Fetch the last dimension value.
  var value = fetchDimension(element.id);

  // If the value existed, set the element's value.
  if (!isNaN(value)) {
    element.value = value;
  }
}


// Set up the button events once the page is loaded.
window.addEventListener("load", function () {
  var preview, saveButton, saveHeight, saveWidth, saver,
      selection, tileReset, tileSize;

  // Set up the preview and selection objects.
  preview = new PatternPreview(document.getElementById("preview-canvas"));
  selection = new Selection(document.getElementById("selection-canvas"));

  // The saving object is set up when an image is loaded.
  saver = null;

  // Grab the save interface.
  saveButton = document.getElementById("save-image");
  saveWidth = document.getElementById("save-width");
  saveHeight = document.getElementById("save-height");

  // Grab the tile interface.
  tileSize = document.getElementById("tile-size");
  tileReset = document.getElementById("tile-reset");

  // Clicking on a label when the values are set by the corresponding attribute
  // in the element can cause the caret to end up on the wrong side of the
  // number. Setting them here reminds the browser that there are already
  // numbers in the boxes.
  saveWidth.value = saveWidth.value;
  saveHeight.value = saveHeight.value;

  // Set up a given output dimension input.
  function setupDimensionInput(element) {
    // Store the values of the dimensions when they change. We use
    // addEventListener here to ensure this behaviour continues when the
    // onchange property is set for tileSize.
    element.addEventListener("change", function () {
      validateAndStoreDimension(element);
    });

    // Load the last used value for this dimension, if possible.
    tryReloadLastDimension(element);
  }

  // Perform the dimension input setup for all inputs.
  setupDimensionInput(saveWidth);
  setupDimensionInput(saveHeight);
  setupDimensionInput(tileSize);

  // Initialise the tile size to twice the smallest dimension of the
  // image, and ensure that their values are stored in localStorage.
  function resetTileSize(image) {
    tileSize.value = Math.min(image.width, image.height) * 2;
    validateAndStoreDimension(tileSize);
  }

  // Set up the preview image and save button from the given image information.
  function setupFromImageInfo(name, type, image) {
    // Create a new cats-eye creator for the new image.
    var catsEye = new CatsEye(image, parseInt(tileSize.value, 10) / 2);

    // Build a new pattern saver from the image information.
    saver = new PatternSaver(name, type);

    // Update the selection canvas with the new image.
    selection.setImage(image);

    // Update the pattern with the current image and tile dimension values, and
    // redraw the preview canvas.
    function updatePattern() {
      var pattern = catsEye.makePattern(selection.triangle.squared());

      saver.setPattern(pattern);
      preview.setPattern(pattern);
    }

    // Create the initial pattern and draw the preview.
    updatePattern();

    // Draw the selection image and preview pattern when the window is resized.
    window.onresize = function () {
      selection.draw();
      preview.draw();
    };

    // Update the pattern when the tile size is changed.
    tileSize.onchange = function () {
      catsEye.setSize(tileSize.value / 2);
      updatePattern();
    };

    // Reset the tile size and update the pattern when the reset button is
    // pressed.
    tileReset.onclick = function () {
      resetTileSize(image);
      tileSize.onchange();
    };

    // Enable the save button.
    saveButton.disabled = false;
  }

  // Save the current render when the save button is clicked.
  saveButton.onclick = function () {
    saver.save(saveWidth.value, saveHeight.value);
  };

  // Select and load an image when the load image button is clicked.
  document.getElementById("load-image").onclick = function () {
    // Prompt for an image.
    selectImage(function (file) {
      // Load the image as a pattern and store it if possible.
      buildAndStoreImageFromFile(file, function (image) {
        // Reset the tile size for the new image.
        resetTileSize(image);

        // Set up the selection, preview and save button from the image
        // information.
        setupFromImageInfo(file.name, file.type, image);
      });
    });
  };

  // Load the last used image, if possible.
  tryReloadLastImage(setupFromImageInfo);
});

// Set up dimension groups appearing on mouse hover.
function setupDimensionGroup(group, dimensions) {
  var timeout;

  // Have the dimension inputs appear when the group surrounding both is hovered
  // over.
  group.onmouseover = function () {
    clearTimeout(timeout);
    dimensions.style.transitionProperty = "none";
    dimensions.style.opacity = 1;
    dimensions.style.display = "inline-block";
  };

  // Have the dimension inputs disappear over a second, and finally no longer be
  // displayed. The fade functionality is defined in the accompanying CSS.
  group.onmouseout = function () {
    dimensions.style.transitionProperty = "opacity";
    dimensions.style.opacity = 0;
    timeout = setTimeout(function () {
      dimensions.style.display = "none";
    }, 1000);
  };
}

// Set up the save dimension interface.
window.addEventListener("load", function () {
  var saveDimensions, saveGroup, tileDimensions, tileGroup;

  // Fetch the groups around the elements.
  saveGroup = document.getElementById("save-group");
  saveDimensions = document.getElementById("save-dimensions");
  tileGroup = document.getElementById("tile-group");
  tileDimensions = document.getElementById("tile-dimensions");

  // Setup the dimension group events.
  setupDimensionGroup(saveGroup, saveDimensions);
  setupDimensionGroup(tileGroup, tileDimensions);
});
