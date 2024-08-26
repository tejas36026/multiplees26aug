self.onmessage = function(e) {
    const { imageData, value } = e.data;
    const width = imageData.width;
    const height = imageData.height;

    const newImageData = new ImageData(width, height);

    newImageData.data.set(imageData.data);

    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);

    const shiftX = Math.floor(value * halfWidth);
    const shiftY = Math.floor(value * halfHeight);

    for (let y = halfHeight; y < height; y++) {
        for (let x = halfWidth; x < width; x++) {
            const newX = halfWidth + ((x - halfWidth + shiftX) % halfWidth);
            const newY = halfHeight + ((y - halfHeight + shiftY) % halfHeight);

            const sourceIndex = (y * width + x) * 4;
            const targetIndex = (newY * width + newX) * 4;

            for (let i = 0; i < 4; i++) {
                newImageData.data[targetIndex + i] = imageData.data[sourceIndex + i];
            }
        }
    }

    self.postMessage({ imageData: newImageData });
};