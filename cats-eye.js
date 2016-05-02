"use strict";

// Construct a fresh prototype from the given constructor without invoking the
// constructor itself.
function Inherit(Super) {
  function Clone() {
    this.constructor = Super;
  }

  Clone.prototype = Super.prototype;
  return new Clone();
}


// A point in two-dimensional space.
function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.fromJSON = function (object) {
  return new Point(object.x, object.y);
};

// Construct a copy of this point.
Point.prototype.copy = function () {
  return new Point(this.x, this.y);
};

// Construct a new point by scaling this point's values.
Point.prototype.scaled = function (scale) {
  return new Point(this.x * scale, this.y * scale);
};

// Calculate whether the given point is within the given radius from this point.
Point.prototype.isWithin = function (point, radius) {
  return Math.sqrt(Math.pow(Math.abs(this.x - point.x), 2) +
                   Math.pow(Math.abs(this.y - point.y), 2)) <= radius;
};


// A right-angled triangle represented by three points, the second of which
// should be opposite the hypotenuse.
function Triangle(a, b, c) {
  this[0] = a;
  this[1] = b;
  this[2] = c;
};

Triangle.fromJSON = function (object) {
  return new Triangle(Point.fromJSON(object[0]),
                      Point.fromJSON(object[1]),
                      Point.fromJSON(object[2]));
};

// Construct a copy of this triangle.
Triangle.prototype.copy = function () {
  return new Triangle(this[0].copy(),
                      this[1].copy(),
                      this[2].copy());
};

// Construct a new triangle by sclaing this triangle's points.
Triangle.prototype.scaled = function (scale) {
  return new Triangle(this[0].scaled(scale),
                      this[1].scaled(scale),
                      this[2].scaled(scale));
};

// Calculate the width of the triangle.
Triangle.prototype.width = function () {
  return Math.abs(this[1].x - this[0].x);
};

// Calculate the height of the triangle.
Triangle.prototype.height = function () {
  return Math.abs(this[2].y - this[1].y);
};

// Construct a new triangle by making the larger straight side the same length
// as the smaller side.
Triangle.prototype.squared = function () {
  var size = Math.min(this.width(), this.height());

  return new Triangle(new Point(this[0].x, this[0].y),
                      new Point(this[0].x + size, this[0].y),
                      new Point(this[0].x + size, this[0].y + size));
};

// Fetch the point with the minimum of the given dimension.
Triangle.prototype.leastPoint = function (dimension) {
  var i, point;

  point = this[0];

  for (i = 1; i < 3; i += 1) {
    if (this[i][dimension] < point[dimension]) {
      point = this[i];
    }
  }

  return point;
};

// Fetch the point with the maximum of the given dimension.
Triangle.prototype.mostPoint = function (dimension) {
  var i, point;

  point = this[0];

  for (i = 1; i < 3; i += 1) {
    if (this[i][dimension] > point[dimension]) {
      point = this[i];
    }
  }

  return point;
};

// Fetch the left-most point of the triangle.
Triangle.prototype.leftmostPoint = function () {
  return this.leastPoint("x");
};

// Fetch the right-most point of the triangle.
Triangle.prototype.rightmostPoint = function () {
  return this.mostPoint("x");
};

// Fetch the top-most point of the triangle.
Triangle.prototype.topmostPoint = function () {
  return this.leastPoint("y");
};

// Fetch the bottom-most point of the triangle.
Triangle.prototype.bottommostPoint = function () {
  return this.mostPoint("y");
};

// Calculate the signed area of this triangle.
Triangle.prototype.area = function () {
  return 1 / 2 * (-this[1].y * this[2].x + this[0].y *
                  (-this[1].x + this[2].x) + this[0].x *
                  (this[1].y - this[2].y) + this[1].x * this[2].y);
};

// Whether the given point is inside the dimensions of the triangle.
Triangle.prototype.isInside = function (point) {
  var a, s, t;

  a = this.area();
  s = 1 / (2 * a) * (this[0].y * this[2].x - this[0].x * this[2].y +
                     (this[2].y - this[0].y) * point.x +
                     (this[0].x - this[2].x) * point.y);
  t = 1 / (2 * a) * (this[0].x * this[1].y - this[0].y * this[1].x +
                     (this[0].y - this[1].y) * point.x +
                     (this[1].x - this[0].x) * point.y);

  return 0 <= s && s <= 1 && 0 <= t && t <= 1 && s + t <= 1;
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

// Set the image and reset the selection points, optionally with a starting
// triangle selection.
Selection.prototype.setImage = function (image, triangle) {
  // Save the image and reset the triangle to the dimensions of the image.
  this.image = image;
  this.triangle = triangle ||
    new Triangle(new Point(0, 0),
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

  // Show the selection pane if it was hidden.
  this.canvas.parentNode.style.display = "inline-block";
};

// Remove the current image and hide the selection pane.
Selection.prototype.reset = function () {
  // Reset the state of the selection.
  this.image = null;
  this.triangle = null;

  // Show the selection pane if it was shown.
  this.canvas.parentNode.style.display = "none";
};


// An object to draw a cats-eye pattern.
function CatsEye(image, scale, showGrid) {
  this.canvas = document.createElement("canvas");

  TrianglePathing.call(this, this.canvas.getContext("2d"));

  this.image = image;
  this.scale = scale;

  this.showGrid = showGrid;
}

CatsEye.prototype = Inherit(TrianglePathing);

// Set the size of the cats-eye effect to the given size.
CatsEye.prototype.setScale = function (scale) {
  this.scale = scale;
};

// Path a triangle directly over the canvas: the canvas has already been sized
// to the dimensions of the triangle, so the triangle we clip is directly over
// the canvas. The points are adjusted slightly to account for gaps in certain
// browser canvas rendering.
CatsEye.prototype.pathDefaultTriangle = function (triangle) {
  var context, height, width;

  context = this.canvas.getContext("2d");

  // Fetch the dimensions of the triangle.
  width = triangle.width();
  height = triangle.height();

  this.pathTriangle(new Triangle(new Point(0, 0),
                                 new Point(width, 0),
                                 new Point(width, height)));
};

// Draw the given triangle on the current canvas.
CatsEye.prototype.drawTriangle = function (triangle) {
  var context = this.canvas.getContext("2d");

  // Path the default triangle.
  this.pathDefaultTriangle(triangle);

  // Draw along the path.
  context.stroke();
};

// Clip the given triangle on the current canvas.
CatsEye.prototype.clipTriangle = function (triangle) {
  var context = this.canvas.getContext("2d");

  // Path the default triangle.
  this.pathDefaultTriangle(triangle);

  // Clip the following image draw to that triangle path.
  context.clip();
};

CatsEye.prototype.drawImage = function (triangle) {
  var context, imageHeight, imageWidth, scaleHorizontal, scaleVertical,
      size, triangleHeight, triangleWidth, x, y;

  context = this.canvas.getContext("2d");

  // Fetch the scaled dimensions of the triangle.
  triangleWidth = triangle.width();
  triangleHeight = triangle.height();

  // Find the minimum length of the triangle, and use that to calculate a scale
  // for each dimension that will deform the image according to the triangle.
  size = Math.min(triangleWidth, triangleHeight);
  scaleHorizontal = size / triangleWidth;
  scaleVertical = size / triangleHeight;

  // Fetch the points nearest the top-left corner of the triangle, and use that
  // to work out how far back from the start of the canvas to start drawing the
  // image.
  x = triangle.leftmostPoint().x * scaleHorizontal;
  y = triangle.topmostPoint().y * scaleVertical;

  // Scale the dimensions of the image both by the general scale and for each
  // specific dimension.
  imageWidth = this.scale * this.image.width * scaleHorizontal;
  imageHeight = this.scale * this.image.height * scaleVertical;

  // Draw the image, moved back to before the start of the canvas and drawn past
  // the end of the canvas for the area that needs to be clipped as a rectangle.
  context.drawImage(this.image, -x, -y, imageWidth, imageHeight);
};

// Draw multiple triangles of the given image to make the full pattern.
CatsEye.prototype.drawTriangles = function (triangle) {
  var context, i, j, leftmostPoint, squared;

  context = this.canvas.getContext("2d");

  // Square the triangle, which will be used for the clipping.
  squared = triangle.squared();

  for (i = 0; i < 4; i += 1) {
    // Draw a triangle and its reflection.
    for (j = 0; j < 2; j += 1) {
      // Reflect the context (this will be undone in the next loop).
      context.scale(1, -1);

      // Save the context to ensure the clip does not apply in the future, then
      // clip the triangle and draw the image.
      context.save();
      this.clipTriangle(squared);
      this.drawImage(triangle);

      // If the application has been asked to draw the clipping grid, do so.
      if (this.showGrid) {
        context.lineWidth = 6;
        context.strokeStyle = "black";
        this.drawTriangle(squared);
        context.lineWidth = 2;
        context.strokeStyle = "white";
        this.drawTriangle(squared);
      }

      context.restore();
    }

    // Draw the inner loop at each of 4 rotation points around the origin.
    context.rotate(Math.PI / 2);
  }
};

// Make a single render on a canvas for the current image, to be repeated as a
// pattern. The given triangle will be squared to ensure a consistent pattern
// with no gaps.
CatsEye.prototype.makePattern = function (triangle) {
  var size;

  // Scale the triangle to the render's scale.
  triangle = triangle.scaled(this.scale);

  // Fetch the minimum dimension of the triangle.
  size = triangle.squared().width();

  // Make the canvas with edges of length twice the size of the triangle, given
  // that the image will be drawn twice in both dimensions, then scaled to the
  // tile scale value. These values are maxed out at 1 to ensure the canvas is
  // large enough to draw on.
  this.canvas.width = Math.max(1, size * 2);
  this.canvas.height = Math.max(1, size * 2);

  // Move the origin into the middle of the canvas.
  this.canvas.getContext("2d").translate(size, size);

  // Draw the pattern with a squared form of the given triangle and return the
  // canvas.
  this.drawTriangles(triangle);
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
PatternSaver.prototype.saveImage = function (width, height) {
  // Construct a link to simulate a click on.
  var link = document.createElement("a");

  // Set the properties of the link from the given information, and dispatch a
  // click to the link to trigger the download.
  link.download = "catseye-" + width + "x" + height + "-" + this.name;
  link.href = this.renderToDataURL(width, height);
  link.dispatchEvent(new MouseEvent("click"));
};

// Perform an image save as above, but use the width and height of the tile.
PatternSaver.prototype.saveTile = function () {
  this.saveImage(this.pattern.width, this.pattern.height);
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
// most recent image to be loaded. Alerts the user if local storage is not
// supported by the platform or the image is too big.
function storeLastImage(name, type, url) {
  try {
    if (typeof localStorage === "object") {
      // Remove the old image, in case the storage fails.
      delete localStorage.image;

      // Save the information as a JSON string.
      localStorage.image = JSON.stringify({
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

// Drop the last image from local storage. Does nothing if no image has been
// saved or if local storage is not supported by the platform.
function dropLastImage() {
  // Check if localStorage is available, and if an image has been saved.
  if (typeof localStorage === "object" && localStorage.image) {
    delete localStorage.image;
  }
}

// Try and save the given dimension value in the persistent store for the given
// name. Does nothing if local storage is not supported by the platform.
function storeDimension(name, value) {
  // Check if localStorage is available, failing silently otherwise or if the
  // store causes an error: if this is failing, the user will probably have
  // already encountered the error when loading the image.
  try {
    if (typeof localStorage === "object" && localStorage.image) {
      localStorage[name] = value;
    }
  } catch (error) {}
}

// Try to fetch the stored value for the given dimension. Returns NaN if no
// value has been saved or if local storage is not supported by the platform.
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

// Drop the dimension of the given name from local storage. Does nothing if no
// such dimension is stored, or if local storage is not supported by the
// platform.
function dropDimension(name) {
  // Check if localStorage is available, and if a dimension has been stored.
  if (typeof localStorage === "object" && localStorage[name]) {
    delete localStorage[name];
  }
}

// Try and save the given selection triangle in the persistent store. Does
// nothing if the local storage is not supported by the platform, or no image
// has been stored there.
function storeSelectionTriangle(triangle) {
  // Check if localStorage is available, failing silently otherwise or if the
  // store causes an error: if this is failing, the user will probably have
  // already encountered the error when loading the image.
  try {
    if (typeof localStorage === "object" && localStorage.image) {
      // Save the information as a JSON string. The triangle will naturally
      // render the appropriate elements.
      localStorage.selectionTriangle = JSON.stringify(triangle);
    }
  } catch (error) {}
}

// Try to fetch the stored selection triangle properties as a record
// object. Returns null if no value has been saved or if local storage is not
// supported by the platform.
function fetchSelectionTriangle() {
  // Check if localStorage is available, and if a triangle has been stored.
  if (typeof localStorage === "object" && localStorage.selectionTriangle) {
    try {
      // Attempt to parse the saved image.
      return Triangle.fromJSON(JSON.parse(localStorage.selectionTriangle));
    } catch (error) {
      // If the parsing failed, the information can't be used and should just
      // be deleted.
      delete localStorage.selectionTriangle;
      return null;
    }
  }

  return null;
}

// Drop any stored selection triangle from the persistent storage.
function dropSelectionTriangle() {
  // Check if localStorage is available.
  if (typeof localStorage === "object") {
    delete localStorage.selectionTriangle;
  }
}

// Try and save the given show grid setting. Does nothing if the local storage
// is not supported by the platform, or no image has been stored there.
function storeShowGrid(value) {
  // Check if localStorage is available, failing silently otherwise or if the
  // store causes an error: if this is failing, the user will probably have
  // already encountered the error when loading the image.
  try {
    if (typeof localStorage === "object" && localStorage.image) {
      // Store true if the value should be set, and delete it otherwise.
      if (value) {
        localStorage.showGrid = true;
      } else {
        delete localStorage.showGrid;
      }
    }
  } catch (error) {}
}

// Try to fetch the stored show grid setting. Defaults to false if no value has
// been saved or if local storage is not supported by the platform.
function fetchShowGrid() {
  if (typeof localStorage === "object" && localStorage.showGrid) {
    return Boolean(localStorage.showGrid);
  }

  return false;
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

// Try and reload the last selection triangle, bounded by the given image.
function tryReloadLastSelectionTriangle(image) {
  // Fetch the last triangle information.
  var i, point, triangle;

  triangle = fetchSelectionTriangle();

  // Bounds-check the triangle if it exists.
  if (triangle) {
    // If any of the triangle points exceed the bounds of the image, the triangle
    // can't have been for this image so should just be dropped.
    for (i = 0; i < 3; i += 1) {
      point = triangle[i];

      if (point.x < 0 || point.x > image.width ||
          point.y < 0 || point.y > image.height) {
        // The triangle is invalid for the current image: delete it and return
        // null.
        dropSelectionTriangle();
        return null;
      }
    }
  }

  return triangle;
}


// Set up the button events once the page is loaded.
window.addEventListener("load", function () {
  var catsEye, dragCorner, dragPoint, dragTriangle, patternUpdate, preview,
      saveImageButton, saveTileButton, saveHeight, saveWidth, saver,
      selection, tileReset, tileScale, toggleGrid;

  // Set up the preview and selection objects.
  preview = new PatternPreview(document.getElementById("preview-canvas"));
  selection = new Selection(document.getElementById("selection-canvas"));

  // The cats-eye and saving object is set up when an image is loaded.
  catsEye = null;
  saver = null;

  // Grab the save interface.
  saveTileButton = document.getElementById("save-tile");
  saveImageButton = document.getElementById("save-image");
  saveWidth = document.getElementById("save-width");
  saveHeight = document.getElementById("save-height");

  // Grab the tile interface.
  tileScale = document.getElementById("tile-scale");
  tileReset = document.getElementById("tile-reset");

  // Grab the toggle grid button.
  toggleGrid = document.getElementById("toggle-grid");

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
    // onchange property is set for tileScale.
    element.addEventListener("change", function () {
      validateAndStoreDimension(element);
    });

    // Load the last used value for this dimension, if possible.
    tryReloadLastDimension(element);
  }

  // Perform the dimension input setup for all inputs.
  setupDimensionInput(saveWidth);
  setupDimensionInput(saveHeight);
  setupDimensionInput(tileScale);

  // Initialise the tile size to twice the smallest dimension of the
  // image, and ensure that their values are stored in localStorage.
  function resetTileSize(image) {
    tileScale.value = 100;
    validateAndStoreDimension(tileScale);
  }

  // Update the pattern with the current image and tile dimension values, and
  // redraw the preview canvas.
  function updatePattern() {
    var pattern = catsEye.makePattern(selection.triangle);

    saver.setPattern(pattern);
    preview.setPattern(pattern);
  }

  // Set up the preview image and save button from the given image information,
  // and optionally a selection triangle.
  function setupFromImageInfo(name, type, image, triangle) {
    // Create a new cats-eye creator for the new image.
    catsEye = new CatsEye(image, parseInt(tileScale.value, 10) / 100,
                          toggleGrid.dataset.showing);

    // Build a new pattern saver from the image information.
    saver = new PatternSaver(name, type);

    // If rendering the image fails, alert the user and trash the current
    // context.
    try {
      // Update the selection canvas with the new image.
      selection.setImage(image, triangle);

      // Create the initial pattern and draw the preview.
      updatePattern();
    } catch (error) {
      // Alert the user.
      alert("Failed to render the image: it might be too big.\n\n" +
            "If the image is large, try resizing it to be smaller " +
            "before loading it.");

      // Forget the context.
      catsEye = null;
      saver = null;

      // Disable the interface.
      saveTileButton.disabled = true;
      saveImageButton.disabled = true;
      selection.reset();

      // Drop the storage without forgetting the save image dimensions.
      dropLastImage();
      dropDimension(tileScale.id);

      return;
    }

    // Draw the selection image and preview pattern when the window is resized.
    window.onresize = function () {
      selection.draw();
      preview.draw();
    };

    // Update the pattern when the tile size is changed.
    tileScale.onchange = function () {
      catsEye.setScale(tileScale.value / 100);
      updatePattern();
    };

    // Reset the tile size and update the pattern when the reset button is
    // pressed.
    tileReset.onclick = function () {
      resetTileSize(image);
      tileScale.onchange();
    };

    // Enable the save buttons.
    saveTileButton.disabled = false;
    saveImageButton.disabled = false;
  }

  // Save the current tile with this save button is clicked.
  saveTileButton.onclick = function () {
    saver.saveTile();
  };

  // Save the current render when this save button is clicked.
  saveImageButton.onclick = function () {
    saver.saveImage(saveWidth.value, saveHeight.value);
  };

  // Select and load an image when the load image button is clicked.
  document.getElementById("load-image").onclick = function () {
    // Prompt for an image.
    selectImage(function (file) {
      // Load the image as a pattern and store it if possible.
      buildAndStoreImageFromFile(file, function (image) {
        // Reset the tile and triangle selection size for the new image.
        resetTileSize(image);
        dropSelectionTriangle();

        // Set up the selection, preview and save button from the image
        // information.
        setupFromImageInfo(file.name, file.type, image);
      });
    });
  };

  // Handler for dragging a selection triangle point.
  function moveSelectionPoint(event) {
    var scale, x, y;

    // Fetch the position of the mouse relative to the position of the image
    // in the selection canvas.
    x = event.pageX - selection.canvas.offsetLeft - Selection.pointRadius;
    y = event.pageY - selection.canvas.offsetTop - Selection.pointRadius;

    // Scale the points to the selection, and ensure the points are bound by
    // the selection box.
    scale = selection.calculateScale();
    x = Math.min(Math.max(0, x / scale), selection.image.width);
    y = Math.min(Math.max(0, y / scale), selection.image.height);

    // Move the corner to the new point.
    selection.triangle[dragCorner] = new Point(x, y);

    // Adjust the other corners to ensure the triangle remains right-angled.
    if (dragCorner === 0) {
      selection.triangle[1] = new Point(selection.triangle[1].x, y);
    } else if (dragCorner === 1) {
      selection.triangle[0] = new Point(selection.triangle[0].x, y);
      selection.triangle[2] = new Point(x, selection.triangle[2].y);
    } else if (dragCorner === 2) {
      selection.triangle[1] = new Point(x, selection.triangle[1].y);
    }

    // Redraw the triangle in the selection box.
    selection.draw();

    // Update the pattern in 20ms, but if a move is made within that time
    // cancel the update and let the next move redraw.
    clearTimeout(patternUpdate);
    patternUpdate = setTimeout(updatePattern, 20);
  }

  // Handler for dragging a selection triangle.
  function moveSelectionTriangle(event) {
    var dx, dy, i, scale, triangle, x, y;

    // Don't notify the page of the drag.
    event.preventDefault();

    // Fetch the position of the mouse relative to the position of the image
    // in the selection canvas.
    x = event.pageX - selection.canvas.offsetLeft - Selection.pointRadius;
    y = event.pageY - selection.canvas.offsetTop - Selection.pointRadius;

    // Scale the points to the selection.
    scale = selection.calculateScale();
    x /= scale;
    y /= scale;

    // Calculate the change in the dimensions from the last point.
    dx = x - dragPoint.x;
    dy = y - dragPoint.y;

    // Move the selection triangle accordingly, also bounded by the selection
    // box.
    triangle = selection.triangle;
    for (i = 0; i < 3; i += 1) {
      triangle[i].x = Math.min(Math.max(0, dragTriangle[i].x + dx),
                               selection.image.width);
      triangle[i].y = Math.min(Math.max(0, dragTriangle[i].y + dy),
                               selection.image.height);
    }

    // Redraw the triangle in the selection box.
    selection.draw();

    // Update the pattern in 20ms, but if a move is made within that time
    // cancel the update and let the next move redraw.
    clearTimeout(patternUpdate);
    patternUpdate = setTimeout(updatePattern, 20);
  }

  // Handler for stopping a drag of a selection triangle point.
  function stopSelectionPointMove() {
    window.removeEventListener("mousemove", moveSelectionPoint);
    window.removeEventListener("touchmove", moveSelectionPoint);
    window.removeEventListener("mouseup", stopSelectionPointMove);
    window.removeEventListener("touchend", stopSelectionPointMove);
    storeSelectionTriangle(selection.triangle);
  }

  // Handler for stopping a drag of a selection triangle.
  function stopSelectionTriangleMove() {
    window.removeEventListener("mousemove", moveSelectionTriangle);
    window.removeEventListener("touchmove", moveSelectionTriangle);
    window.removeEventListener("mouseup", stopSelectionTriangleMove);
    window.removeEventListener("touchend", stopSelectionTriangleMove);
    storeSelectionTriangle(selection.triangle);
  }

  // Set up the mouse interaction with the selection triangle.
  function handleSelectionDrag(event) {
    var i, point, radius, scale, x, y;

    // Don't notify the page of the drag.
    event.preventDefault();

    // Only proceed if the selection has a triangle to select.
    if (selection.triangle !== null && selection.image !== null) {
      // Fetch the radius of the selection points.
      radius = Selection.pointRadius;

      // Fetch the position of the mouse relative to the position of the image
      // in the selection canvas.
      x = event.pageX - selection.canvas.offsetLeft - radius;
      y = event.pageY - selection.canvas.offsetTop - radius;

      // Scale the points to the selection.
      scale = selection.calculateScale();
      point = new Point(x / scale, y / scale);

      // For each point, check if the mouse is on top of the point.
      for (i = 0; i < 3; i += 1) {
        // The radius has to be scaled as well, because the points we are
        // comparing have already been scaled.
        if (selection.triangle[i].isWithin(point, radius / scale)) {
          // If it is, store which point, add the drag listeners, and exit this
          // handler.
          dragCorner = i;
          window.addEventListener("mousemove", moveSelectionPoint);
          window.addEventListener("touchmove", moveSelectionPoint);
          window.addEventListener("mouseup", stopSelectionPointMove);
          window.addEventListener("touchend", stopSelectionPointMove);
          return;
        }
      }

      // Otherwise check if the mouse is inside of the triangle.
      if (selection.triangle.isInside(point)) {
        // If it is, store the point where it was clicked and the original
        // triangle, and add the drag listeners.
        dragPoint = point;
        dragTriangle = selection.triangle.copy();
        window.addEventListener("mousemove", moveSelectionTriangle);
        window.addEventListener("touchmove", moveSelectionTriangle);
        window.addEventListener("mouseup", stopSelectionTriangleMove);
        window.addEventListener("touchend", stopSelectionTriangleMove);
      }
    }
  }

  selection.canvas.addEventListener("mousedown", handleSelectionDrag);
  selection.canvas.addEventListener("touchstart", handleSelectionDrag);

  function showGrid() {
    toggleGrid.dataset.showing = true;
    toggleGrid.innerText = "Hide Grid";
    storeShowGrid(true);

    if (catsEye) {
      catsEye.showGrid = true;
      updatePattern();
    }
  }

  function hideGrid() {
    delete toggleGrid.dataset.showing;
    toggleGrid.innerText = "Show Grid";
    storeShowGrid(false);

    if (catsEye) {
      catsEye.showGrid = false;
      updatePattern();
    }
  }

  // Set the stored show grid setting, which defaults to false.
  if (fetchShowGrid()) {
    showGrid();
  } else {
    hideGrid();
  }

  // Toggle the show grid setting when the toggle button is clicked.
  toggleGrid.addEventListener("click", function () {
    if (toggleGrid.dataset.showing) {
      hideGrid();
    } else {
      showGrid();
    }
  });

  // Load the last used image and selection, if possible.
  tryReloadLastImage(function (name, type, image) {
    setupFromImageInfo(name, type, image,
                       tryReloadLastSelectionTriangle(image));
  });
});

// Set up dimension groups appearing on mouse hover.
function setupAuxiliaryGroup(group, auxiliary) {
  var timeout;

  // Have the dimension inputs appear when the group surrounding both is hovered
  // over.
  group.onmouseover = function () {
    clearTimeout(timeout);
    auxiliary.style.transitionProperty = "none";
    auxiliary.style.opacity = 1;
    auxiliary.style.display = "inline-block";
  };

  // Have the auxiliary inputs disappear over a second, and finally no longer be
  // displayed. The fade functionality is defined in the accompanying CSS.
  group.onmouseout = function () {
    auxiliary.style.transitionProperty = "opacity";
    auxiliary.style.opacity = 0;
    timeout = setTimeout(function () {
      auxiliary.style.display = "none";
    }, 1000);
  };
}

// Set up the save dimension interface.
window.addEventListener("load", function () {
  var saveAuxiliary, saveGroup, tileAuxiliary, tileGroup;

  // Fetch the groups around the elements.
  saveGroup = document.getElementById("save-image-group");
  saveAuxiliary = document.getElementById("save-auxiliary");
  tileGroup = document.getElementById("tile-group");
  tileAuxiliary = document.getElementById("tile-auxiliary");

  // Setup the dimension group events.
  setupAuxiliaryGroup(saveGroup, saveAuxiliary);
  setupAuxiliaryGroup(tileGroup, tileAuxiliary);
});
