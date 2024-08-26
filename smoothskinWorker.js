self.onmessage = function(e) {
    const {
        imageData,
        selectedRegions,
        imageCount,
        maxBrightness,
        value1,
        value2,
        value3,
        value4,
        value5,
        clickedPoints,
        lines
    } = e.data;

    const segmentedImages = [];

    const blurRadius = 8; // Adjust the blur radius as needed

    for (let i = 0; i < imageCount; i++) {
        for (let variation = 0; variation < 8; variation++) {
            const newImageData = new ImageData(
                new Uint8ClampedArray(imageData.data),
                imageData.width,
                imageData.height
            );

            for (const region of selectedRegions) {
                for (const pixelIndex of region) {
                    const x = pixelIndex % imageData.width;
                    const y = Math.floor(pixelIndex / imageData.width);
                    const index = (y * imageData.width + x) * 4;

                    // Apply Gaussian blur to the pixels in the selected region
                    applyGaussianBlur(newImageData, x, y, blurRadius);
                }
            }

            applyAdditionalEffects(newImageData, value1 + variation, value2 + variation, value3, value4, value5);
            segmentedImages.push(newImageData);
        }
    }

    self.postMessage({ segmentedImages: segmentedImages });
};

function applyGaussianBlur(imageData, x, y, radius) {
    const { width, height, data } = imageData;
    const kernel1D = createGaussianKernel1D(radius);
    const tempData = new Float32Array(4);
  
    // Horizontal pass
    for (let i = 0; i < 4; i++) {
      let sum = 0;
      for (let kx = -radius; kx <= radius; kx++) {
        const px = x + kx;
        if (px >= 0 && px < width) {
          const index = (y * width + px) * 4 + i;
          sum += data[index] * kernel1D[kx + radius];
        }
      }
      tempData[i] = sum;
    }
  
    // Vertical pass
    for (let i = 0; i < 4; i++) {
      let sum = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const py = y + ky;
        if (py >= 0 && py < height) {
          sum += tempData[i] * kernel1D[ky + radius];
        }
      }
      const index = (y * width + x) * 4 + i;
      data[index] = Math.round(sum);
    }
  }
  
  function createGaussianKernel1D(radius) {
    const kernel = new Float32Array(2 * radius + 1);
    const sigma = radius / 3;
    let sum = 0;
    for (let x = -radius; x <= radius; x++) {
      const exp = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[x + radius] = exp;
      sum += exp;
    }
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
    return kernel;
  }


function isSkinColor(r, g, b) {
    // Define a range of skin color values
    const skinColorRange = {
        minR: 150,
        maxR: 230,
        minG: 100,
        maxG: 180,
        minB: 70,
        maxB: 150
    };

    return (
        r >= skinColorRange.minR &&
        r <= skinColorRange.maxR &&
        g >= skinColorRange.minG &&
        g <= skinColorRange.maxG &&
        b >= skinColorRange.minB &&
        b <= skinColorRange.maxB
    );
}


function applyAdditionalEffects(imageData, value1, value2, value3, value4, value5) {
    const saturationAdjustment = value1 / 100;

    for (let i = 0; i < imageData.data.length; i += 4) {
        const [h, s, l] = rgbToHsl(
            imageData.data[i],
            imageData.data[i + 1],
            imageData.data[i + 2]
        );

        const newSaturation = Math.min(1, Math.max(0, s * (1 + saturationAdjustment)));
        const [r, g, b] = hslToRgb(h, newSaturation, l);

        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
    }
}

// Helper functions for color conversion
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}