self.onmessage = function(e) {
    const {
        imageData,
        selectedRegions,
        imageCount,
        value1,
        value2,
        value3,
        value4,
        value5,
        clickedPoints,
        lines
    } = e.data;

    const segmentedImages = [];
    const blockSize = Math.max(1, Math.floor(value1)); // Use value1 as block size
    const width = imageData.width;
    const height = imageData.height;

    for (let i = 0; i < imageCount; i++) {
        // Create a copy of the original image data
        const newImageData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            width,
            height
        );

        // Calculate dissolve threshold for this image
        const dissolveThreshold = i / (imageCount - 1);

        // Create a Set for faster lookup of selected pixels
        const selectedPixels = new Set(selectedRegions.flat());

        // Apply block dissolve effect to selected regions
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                // Check if any pixel in this block is in a selected region
                let blockSelected = false;
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        if (selectedPixels.has((y + by) * width + (x + bx))) {
                            blockSelected = true;
                            break;
                        }
                    }
                    if (blockSelected) break;
                }

                if (blockSelected && Math.random() < dissolveThreshold) {
                    const randomOffset = Math.random() < 0.5 ? 0 : blockSize;
                    for (let by = 0; by < blockSize && y + by < height; by++) {
                        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                            const sourceX = (x + bx + randomOffset) % width;
                            const sourceY = (y + by + randomOffset) % height;
                            const sourceIndex = (sourceY * width + sourceX) * 4;
                            const targetIndex = ((y + by) * width + (x + bx)) * 4;
                            for (let i = 0; i < 4; i++) {
                                newImageData.data[targetIndex + i] = imageData.data[sourceIndex + i];
                            }
                        }
                    }
                }
            }
        }

        // Handle clicked points
        for (const point of clickedPoints) {
            const x = point[0];
            const y = point[1];
            const pixelIndex = (y * width + x) * 4;

            // Apply a special effect to clicked points (e.g., make them red)
            newImageData.data[pixelIndex] = 255; // Red
            newImageData.data[pixelIndex + 1] = 0; // Green
            newImageData.data[pixelIndex + 2] = 0; // Blue
            newImageData.data[pixelIndex + 3] = 255; // Alpha
        }

        // Apply additional effects based on value2, value3, etc.
        applyAdditionalEffects(newImageData, value2, value3, value4, value5);

        segmentedImages.push(newImageData);
    }

    // Send the processed images back to the main script
    self.postMessage({ segmentedImages: segmentedImages });
};

function applyAdditionalEffects(imageData, value2, value3, value4, value5) {
    // This is a placeholder function. You can implement additional effects here.
    // For example, you could use these values to adjust contrast, saturation, etc.

    // Here's a simple example that adjusts the red channel based on value2:
    const redAdjustment = value2 / 100; // Assuming value2 is a percentage

    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] * (1 + redAdjustment)));
    }

    // You can add more effects using the other values (value3, value4, etc.)
}