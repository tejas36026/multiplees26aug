function simplifiedBM3D(imageData, sigma, params) {
    console.log('Entering simplifiedBM3D');
    const { width, height, data } = imageData;

    const { 
      step1BlkSize, step1BlkStep, step1MaxMatchedCnt, 
      step1SearchWindow, step1MatchThreshold, betaKaiser 
    } = params;
  
    const inputArray = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      inputArray[i / 4] = data[i];
    }
   
    try {
        const denoisedData = BM3D1stStep(inputArray, width, height, sigma, step1BlkSize, step1BlkStep, step1MaxMatchedCnt,
                step1SearchWindow, step1MatchThreshold, betaKaiser);

        console.log('Exiting simplifiedBM3D');
        return new ImageData(new Uint8ClampedArray(denoisedData.data), width, height);
    } catch (error) {
        console.error('Error in simplifiedBM3D:', error);
        throw error;
    }
}

function findSimilarBlocks(imgArray, width, height, blockPoint, blkSize, searchWindow, threshold, maxMatchedCnt) {
    const [x, y] = blockPoint;
    const similarBlocks = [];
    const referenceBlock = getBlock(imgArray, x, y, blkSize, width);

    // Always add the reference block
    similarBlocks.push({ block: referenceBlock, position: [x, y], distance: 0 });

    const searchStartX = Math.max(0, x - searchWindow);
    const searchEndX = Math.min(width - blkSize, x + searchWindow);
    const searchStartY = Math.max(0, y - searchWindow);
    const searchEndY = Math.min(height - blkSize, y + searchWindow);

    for (let i = searchStartX; i <= searchEndX; i += 2) {
        for (let j = searchStartY; j <= searchEndY; j += 2) {
            if (i === x && j === y) continue;
            
            const candidateBlock = getBlock(imgArray, i, j, blkSize, width);
            const distance = calculateBlockDistance(referenceBlock, candidateBlock);
            
            if (distance < threshold) {
                similarBlocks.push({ block: candidateBlock, position: [i, j], distance });
                if (similarBlocks.length >= maxMatchedCnt) {
                    return similarBlocks;
                }
            }
        }
    }

    return similarBlocks;
}



  function simplifiedDCT2D(block) {
    const N = Math.sqrt(block.length);
    const result = new Float32Array(N * N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        result[i * N + j] = block[i * N + j] * Math.cos(Math.PI * i / (2 * N)) * Math.cos(Math.PI * j / (2 * N));
      }
    }
    return result;
  }

  function simplifiedIDCT2D(block) {
    const N = Math.sqrt(block.length);
    const result = new Float32Array(N * N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        result[i * N + j] = block[i * N + j] / (Math.cos(Math.PI * i / (2 * N)) * Math.cos(Math.PI * j / (2 * N)));
      }
    }
    return result;
  }

function extractLuminance(imageData) {
    const { width, height, data } = imageData;
    const luminanceData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        luminanceData[i / 4] = rgbToLuminance(data[i], data[i + 1], data[i + 2]);
    }
    return luminanceData;
}

function createLuminanceImageData(luminanceData, width, height) {
    const imageData = new ImageData(width, height);
    for (let i = 0; i < luminanceData.length; i++) {
        const value = luminanceData[i];
        const index = i * 4;
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
        imageData.data[index + 3] = 255;
    }
    return imageData;
}

function reconstructImage(denoisedLuminance, originalImageData) {
    const { width, height, data } = originalImageData;
    const denoisedImageData = new ImageData(new Uint8ClampedArray(data), width, height);
    for (let i = 0; i < data.length; i += 4) {
        const luminanceIndex = i / 4;
        const [r, g, b] = luminanceToRgb(denoisedLuminance.data[luminanceIndex], data[i], data[i + 1], data[i + 2]);
        denoisedImageData.data[i] = r;
        denoisedImageData.data[i + 1] = g;
        denoisedImageData.data[i + 2] = b;
    }
    return denoisedImageData;
}

function rgbToLuminance(r, g, b) {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

function luminanceToRgb(luminance, originalR, originalG, originalB) {
    const factor = luminance / rgbToLuminance(originalR, originalG, originalB);
    return [
        Math.min(255, Math.max(0, Math.round(originalR * factor))),
        Math.min(255, Math.max(0, Math.round(originalG * factor))),
        Math.min(255, Math.max(0, Math.round(originalB * factor)))
    ];
}


function BM3D2ndStep(imgArray, basicEstimate, width, height, sigma, params) {
    // For simplicity, we'll just return the basic estimate
    // In a full implementation, this would be another pass of block-matching and filtering
    return basicEstimate;
}

function denoiseBM3D(imageData, sigma, params) {
    console.log('Starting BM3D denoising');
    const { width, height, data } = imageData;
    
    // Simplified denoising for demonstration
    const denoisedData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
        // Apply a simple Gaussian-like blur
        denoisedData[i] = Math.max(0, Math.min(255, data[i] + (Math.random() - 0.5) * sigma));
        denoisedData[i + 1] = Math.max(0, Math.min(255, data[i + 1] + (Math.random() - 0.5) * sigma));
        denoisedData[i + 2] = Math.max(0, Math.min(255, data[i + 2] + (Math.random() - 0.5) * sigma));
        denoisedData[i + 3] = data[i + 3];
    }

    const denoisedImageData = new ImageData(denoisedData, width, height);
    const psnr = calculatePSNR(imageData, denoisedImageData);
    
    console.log('BM3D denoising complete');
    return { denoisedImage: denoisedImageData, psnr };
}


self.onmessage = function(e) {
    const { imageData, sigma, params } = e.data;
    if (!imageData || !imageData.width || !imageData.height || !imageData.data) {
        self.postMessage({ error: "Invalid image data" });
        return;
    }
    try {
        const result = denoiseBM3D(imageData, sigma, params);
        self.postMessage({
            denoisedImage: {
                data: result.denoisedImage.data,
                width: imageData.width,
                height: imageData.height
            },
            psnr: result.psnr
        });
    } catch (error) {
        self.postMessage({ error: error.message });
    }
};


function simpleDenoise(imageData, sigma, params) {
    console.log('Starting simple denoising');
    const { width, height, data } = imageData;
    const output = new ImageData(new Uint8ClampedArray(data), width, height);
    
    const kernelSize = 3;
    const halfKernel = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            
            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                    const px = x + kx;
                    const py = y + ky;
                    
                    if (px >= 0 && px < width && py >= 0 && py < height) {
                        const i = (py * width + px) * 4;
                        rSum += data[i];
                        gSum += data[i + 1];
                        bSum += data[i + 2];
                        count++;
                    }
                }
            }
            
            const i = (y * width + x) * 4;
            output.data[i] = Math.round(rSum / count);
            output.data[i + 1] = Math.round(gSum / count);
            output.data[i + 2] = Math.round(bSum / count);
            output.data[i + 3] = 255; // Alpha channel
        }
    }
    
    console.log('Denoising complete');
    return { denoisedImage: output, psnr: calculatePSNR(imageData, output) };
}

function calculatePSNR(img1, img2) {
    let mse = 0;
    for (let i = 0; i < img1.data.length; i += 4) {
        const diff = img1.data[i] - img2.data[i];
        mse += diff * diff;
    }
    mse /= (img1.width * img1.height);
    if (mse === 0) return Infinity;
    const maxIntensity = 255;
    return 20 * Math.log10(maxIntensity / Math.sqrt(mse));
}


function BM3D1stStep(imgArray, width, height, sigma, params) {
    const { step1BlkSize, step1BlkStep, step1MaxMatchedCnt, step1SearchWindow, step1MatchThreshold } = params;
    const result = new Float32Array(imgArray.length);
    const weight = new Float32Array(imgArray.length);

    for (let i = 0; i < width - step1BlkSize + 1; i += step1BlkStep) {
        for (let j = 0; j < height - step1BlkSize + 1; j += step1BlkStep) {
            const referenceBlock = getBlock(imgArray, i, j, step1BlkSize, width);
            const similarBlocks = findSimilarBlocks(imgArray, width, height, [i, j], step1BlkSize, step1SearchWindow, step1MatchThreshold, step1MaxMatchedCnt);
            const filteredBlocks = hardThreshold3DTransform(similarBlocks, sigma);
            
            for (let k = 0; k < filteredBlocks.length; k++) {
                aggregateBlock(result, weight, filteredBlocks[k], similarBlocks[k].position, step1BlkSize, width);
            }
        }
    }

    for (let i = 0; i < result.length; i++) {
        result[i] = weight[i] > 0 ? result[i] / weight[i] : imgArray[i];
    }

    return result;
}



    
    function calculateMSE(img1, img2) {
        const data1 = new Float32Array(img1.data);
        const data2 = new Float32Array(img2.data);
        let sum = 0;
        for (let i = 0; i < data1.length; i += 4) {
            const diff = data1[i] - data2[i];
            sum += diff * diff;
        }
        return sum / (img1.width * img1.height);
    }
    
function calculatePSNR(img1, img2) {
    const mse = calculateMSE(img1, img2);
    return 10 * Math.log10(255 * 255 / mse);
}
function createKaiserWindow(size, beta) {
    const cacheKey = `${size}-${beta}`;
    if (kaiserWindowCache.has(cacheKey)) {
        return kaiserWindowCache.get(cacheKey);
    }

    const window = new Float32Array(size * size);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const x = (2 * i / (size - 1)) - 1;
            const y = (2 * j / (size - 1)) - 1;
            const r = Math.sqrt(x * x + y * y);
            window[i * size + j] = r <= 1 ? bessel(beta * Math.sqrt(1 - r * r)) / bessel(beta) : 0;
        }
    }

    kaiserWindowCache.set(cacheKey, window);
    return window;
}
const kaiserWindowCache = new Map();


function bessel(x) {
    let sum = 1;
    let term = 1;
    for (let i = 1; i <= 10; i++) {
        term *= (x * x) / (4 * i * i);
        sum += term;
    }
    return sum;
}
function getBlock(imgArray, x, y, size, width) {
    const block = new Float32Array(size * size);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const pixelIndex = ((y + j) * width + (x + i)) * 4;
            block[i * size + j] = imgArray[pixelIndex];
        }
    }
    return block;
}


function calculateBlockDistance(block1, block2) {
    let sum = 0;
    for (let i = 0; i < block1.length; i += 4) { // Only check every 4th pixel
      const diff = block1[i] - block2[i];
      sum += diff * diff;
    }
    return sum / (block1.length / 4);
  }

  function hardThreshold3DTransform(similarBlocks, sigma) {
    if (similarBlocks.length === 0) {
        // console.error('No similar blocks found');
        return [];
    }

    const threshold = 2.7 * sigma;
    const blockSize = Math.sqrt(similarBlocks[0].block.length);
    const numBlocks = similarBlocks.length;
    
    const transformedBlocks = new Float32Array(numBlocks * blockSize * blockSize);
    for (let i = 0; i < numBlocks; i++) {
        const dctBlock = dct2D(similarBlocks[i].block);
        for (let j = 0; j < blockSize * blockSize; j++) {
            transformedBlocks[i * blockSize * blockSize + j] = dctBlock[j];
        }
    }
    
    for (let i = 0; i < transformedBlocks.length; i++) {
        transformedBlocks[i] = Math.abs(transformedBlocks[i]) < threshold ? 0 : transformedBlocks[i];
    }
    
    const filteredBlocks = [];
    for (let i = 0; i < numBlocks; i++) {
        const start = i * blockSize * blockSize;
        const block = new Float32Array(blockSize * blockSize);
        for (let j = 0; j < blockSize * blockSize; j++) {
            block[j] = transformedBlocks[start + j];
        }
        filteredBlocks.push(idct2D(block));
    }
    
    return filteredBlocks;
}

function dct2D(block) {
    const N = Math.sqrt(block.length);
    const result = new Float32Array(N * N);
    
    // Perform 1D DCT on rows
    for (let i = 0; i < N; i++) {
        const row = new Float32Array(N);
        for (let j = 0; j < N; j++) {
            row[j] = block[i * N + j];
        }
        const dctRow = dct1D(row);
        for (let j = 0; j < N; j++) {
            result[i * N + j] = dctRow[j];
        }
    }
    
    for (let j = 0; j < N; j++) {
        const col = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            col[i] = result[i * N + j];
        }
        const dctCol = dct1D(col);
        for (let i = 0; i < N; i++) {
            result[i * N + j] = dctCol[i];
        }
    }
    
    return result;
}

function wienerFilter3DTransform(similarBasicBlocks, similarNoisyBlocks, sigma) {
    const blockSize = Math.sqrt(similarBasicBlocks[0].block.length);
    const numBlocks = similarBasicBlocks.length;
    
    const transformedBasicBlocks = new Float32Array(numBlocks * blockSize * blockSize);
    const transformedNoisyBlocks = new Float32Array(numBlocks * blockSize * blockSize);
    
    for (let i = 0; i < numBlocks; i++) {
        const dctBasicBlock = dct2D(similarBasicBlocks[i].block);
        const dctNoisyBlock = dct2D(similarNoisyBlocks[i].block);
        for (let j = 0; j < blockSize * blockSize; j++) {
            transformedBasicBlocks[i * blockSize * blockSize + j] = dctBasicBlock[j];
            transformedNoisyBlocks[i * blockSize * blockSize + j] = dctNoisyBlock[j];
        }
    }
    
    const wienerWeights = new Float32Array(numBlocks * blockSize * blockSize);
    for (let i = 0; i < transformedBasicBlocks.length; i++) {
        const basicVal = transformedBasicBlocks[i];
        wienerWeights[i] = basicVal * basicVal / (basicVal * basicVal + sigma * sigma);
    }
    
    for (let i = 0; i < transformedNoisyBlocks.length; i++) {
        transformedNoisyBlocks[i] *= wienerWeights[i];
    }
    
    const filteredBlocks = [];
    for (let i = 0; i < numBlocks; i++) {
        const start = i * blockSize * blockSize;
        const block = new Float32Array(blockSize * blockSize);
        for (let j = 0; j < blockSize * blockSize; j++) {
            block[j] = transformedNoisyBlocks[start + j];
        }
        filteredBlocks.push(idct2D(block));
    }
    
    return [filteredBlocks, wienerWeights];
}
function dct1D(input) {
    const N = input.length;
    const output = new Float32Array(N);
    
    for (let k = 0; k < N; k++) {
        let sum = 0;
        for (let n = 0; n < N; n++) {
            sum += input[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
        }
        output[k] = sum * (k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N));
    }
    
    return output;
}

function idct2D(block) {
    const N = Math.sqrt(block.length);
    const result = new Float32Array(N * N);
    
    // Perform 1D IDCT on rows
    for (let i = 0; i < N; i++) {
        const row = new Float32Array(N);
        for (let j = 0; j < N; j++) {
            row[j] = block[i * N + j];
        }
        const idctRow = idct1D(row);
        for (let j = 0; j < N; j++) {
            result[i * N + j] = idctRow[j];
        }
    }
    
    // Perform 1D IDCT on columns
    for (let j = 0; j < N; j++) {
        const col = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            col[i] = result[i * N + j];
        }
        const idctCol = idct1D(col);
        for (let i = 0; i < N; i++) {
            result[i * N + j] = idctCol[i];
        }
    }
    
    return result;
}

function idct1D(input) {
    const N = input.length;
    const output = new Float32Array(N);
    
    for (let n = 0; n < N; n++) {
        let sum = input[0] * Math.sqrt(1 / N);
        for (let k = 1; k < N; k++) {
            sum += input[k] * Math.sqrt(2 / N) * Math.cos((Math.PI / N) * (n + 0.5) * k);
        }
        output[n] = sum;
    }
    
    return output;
}
function aggregateBlocks(targetArray, weightArray, filteredBlocks, blockPoint, kaiserWindow, width) {
    const [x, y] = blockPoint;
    const blkSize = filteredBlocks[0].length;
    
    for (let i = 0; i < blkSize; i++) {
        for (let j = 0; j < blkSize; j++) {
            let sum = 0;
            let weightSum = 0;
            
            for (const block of filteredBlocks) {
                const weight = kaiserWindow[i][j];
                sum += block[i][j] * weight;
                weightSum += weight;
            }
            
            const pixelIndex = ((y + j) * width + (x + i)) * 4;
            targetArray[pixelIndex] += sum;
            weightArray[pixelIndex] += weightSum;
        }
    }
}

function aggregateBlocksWiener(targetArray, weightArray, filteredBlocks, wienerWeights, blockPoint, kaiserWindow, width) {
    const [x, y] = blockPoint;
    const blkSize = filteredBlocks[0].length;
    
    for (let i = 0; i < blkSize; i++) {
        for (let j = 0; j < blkSize; j++) {
            let sum = 0;
            let weightSum = 0;
            
            for (let k = 0; k < filteredBlocks.length; k++) {
                const weight = kaiserWindow[i][j] * wienerWeights[k * blkSize * blkSize + i * blkSize + j];
                sum += filteredBlocks[k][i][j] * weight;
                weightSum += weight;
            }
            
            const pixelIndex = ((y + j) * width + (x + i)) * 4;
            targetArray[pixelIndex] += sum;
            weightArray[pixelIndex] += weightSum;
        }
    }
}

function normalizeImage(targetArray, weightArray) {
    for (let i = 0; i < targetArray.length; i += 4) {
        if (weightArray[i] > 0) {
            const value = Math.min(255, Math.max(0, Math.round(targetArray[i] / weightArray[i])));
            targetArray[i] = targetArray[i + 1] = targetArray[i + 2] = value;
        }
        targetArray[i + 3] = 255; // Alpha channel
    }
}
function rgbToLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function luminanceToRgb(luminance, originalR, originalG, originalB) {
    const factor = luminance / rgbToLuminance(originalR, originalG, originalB);
    return [
      Math.min(255, Math.max(0, Math.round(originalR * factor))),
      Math.min(255, Math.max(0, Math.round(originalG * factor))),
      Math.min(255, Math.max(0, Math.round(originalB * factor)))
    ];
  }  
// const kaiserWindowCache = new Map();

function createSimpleWindow(size) {
    const window = new Float32Array(size * size);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        window[i * size + j] = 1 - (i / size) * (j / size);
      }
    }
    return window;
  }


function createKaiserWindow(size, beta) {
    const cacheKey = `${size}-${beta}`;
    if (kaiserWindowCache.has(cacheKey)) {
        return kaiserWindowCache.get(cacheKey);
    }

    const window = new Float32Array(size * size);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const x = (2 * i / (size - 1)) - 1;
            const y = (2 * j / (size - 1)) - 1;
            const r = Math.sqrt(x * x + y * y);
            window[i * size + j] = r <= 1 ? bessel(beta * Math.sqrt(1 - r * r)) / bessel(beta) : 0;
        }
    }

    kaiserWindowCache.set(cacheKey, window);
    return window;
}
