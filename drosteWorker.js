self.onmessage = function(e) {
    const { imageData, value } = e.data;
    const [scale, twist, repeat] = value;
    const width = imageData.width;
    const height = imageData.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const newImageData = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            let radius = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx);

            radius = Math.pow(scale, Math.log(radius / Math.min(width, height)) / Math.log(scale)) * Math.min(width, height);
            angle += twist * Math.log(radius / Math.min(width, height)) / Math.log(scale);

            const sourceX = Math.round(centerX + radius * Math.cos(angle));
            const sourceY = Math.round(centerY + radius * Math.sin(angle));

            if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
                const sourceIndex = (sourceY * width + sourceX) * 4;
                const targetIndex = (y * width + x) * 4;
                for (let i = 0; i < 4; i++) {
                    newImageData.data[targetIndex + i] = imageData.data[sourceIndex + i];
                }
            }
        }
    }

    self.postMessage({ imageData: newImageData });
};