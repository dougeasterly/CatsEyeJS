// Wait until the elements and the example image have loaded.
window.onload = function () {
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

  function drawTriangles(image, context, size) {
    var i, j;

    // Draw a triangle and its reflection at each of four rotations around the
    // origin.
    for (i = 0; i < 4; i += 1) {
      for (j = 0; j < 2; j += 1) {
        context.scale(1, -1);
        drawTriangle(image, context, size);
      }

      context.rotate(Math.PI / 2);
    }
  }

  function makePattern(image) {
    var canvas, context, size;

    // Grab the image and the canvas, and get the size of the image's smallest
    // dimension.
    canvas = document.createElement("canvas");
    size = Math.min(image.width, image.height);

    // Make the canvas a square with edges of length the size.
    canvas.width = canvas.height = size * 2;

    // Grab the context, and move the origin into the middle of the canvas.
    context = canvas.getContext("2d");
    context.translate(size, size);

    drawTriangles(image, context, size);

    return canvas;
  }

  // Fill the screen with the larger canvas, and draw the smaller canvas as a
  // repeating pattern on the larger canvas.
  function drawPattern(layout) {
    var canvas, container, context, height, pattern, size, width;

    // Fetch the size of the layout canvas, which is assumed to be a square. The
    // size of the image is half of the size of the canvas.
    size = layout.width / 2;

    // Now grab the canvas and context of the larger canvas, and fetch the
    // previous cavnas as a repeating pattern in the larger context.
    canvas = document.getElementById("preview-canvas");
    context = canvas.getContext("2d");
    pattern = context.createPattern(layout, "repeat");

    // Set the size of the larger canvas to the size of the container.
    container = document.getElementById("preview");
    canvas.width = canvas.height = 0;
    width = canvas.width = container.offsetWidth;
    height = canvas.height = container.offsetHeight;

    // Move the origin to the center of the canvas, then back by half the size
    // of the small canvas, and then draw a rectangle from back at the top left
    // corner to the size of the large canvas. Fill the rectangle with the
    // contexting pattern of the smaller canvas.
    context.translate(width / 2 - size, height / 2 - size);
    context.rect(-width / 2 + size, -height / 2 + size, width, height);
    context.fillStyle = pattern;
    context.fill();
  }

  // Load image functionality.
  (function () {
    var image, lastImage, loader, reader, saver;

    // Construct an image element for putting loaded images into. When it loads
    // an image, draw it as a pattern immediately.
    image = document.createElement("img");
    image.onload = function () {
      var pattern = makePattern(this);

      // Resize and draw on the larger canvas as soon as everything is ready.
      drawPattern(pattern);

      // When the window is resized, resize the canvas to fill the new screen
      // size.
      window.onresize = function () {
        drawPattern(pattern);
      };
    };

    // Construct a reader that writes its result to the source of the image.
    reader = new FileReader();
    reader.onload = function () {
      // Fetch the file that was just loaded.
      var file = loader.files[0];

      // Save the information about the image.
      lastImage =
        { "name": file.name
        , "type": file.type
        , "url": this.result
        };

      // If localStorage is available, use it to save the last loaded image.
      if (typeof localStorage === "object") {
        localStorage.lastImage = JSON.stringify(lastImage);
      }

      // Set the source of the image, triggering the onload event above.
      image.src = lastImage.url;
    };

    // If an image was stored in localStorage, use that for an initial pattern.
    if (typeof localStorage === "object" && localStorage.lastImage) {
      lastImage = JSON.parse(localStorage.lastImage);
      image.src = lastImage.url;
    }

    // Construct a file loader for images.
    loader = document.createElement("input");
    loader.type = "file";
    loader.accept = "image/*";
    loader.onchange = function () {
      var file = this.files[0];

      // Check if a file was provided. Might be worth checking the type of the
      // file is an image in the future.
      if (file) {
        reader.readAsDataURL(file);
      }
    };

    // Use a regular button to activate the private file loader.
    document.getElementById("load-image").onclick = function () {
      loader.click();
    };

    // Construct a file save link.
    saver = document.createElement("a");

    // Use a regular button to activate the private file saver.
    document.getElementById("save-image").onclick = function () {
      // Fetch the preview canvas as the output image. In the future this should
      // be a private canvas which has the appropriate dimensions.
      var canvas = document.getElementById("preview-canvas");

      // Calculate the name and type of the output file from the input, and
      // trigger the save.
      saver.download = "catseye-" + lastImage.name;
      saver.href = canvas.toDataURL(lastImage.type);
      saver.click();
    };
  }());
};
