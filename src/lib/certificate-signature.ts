async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read signature image"));
      image.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function makeSignatureBackgroundTransparent(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const totalPixels = width * height;

  let edgeSampleCount = 0;
  let backgroundR = 0;
  let backgroundG = 0;
  let backgroundB = 0;

  const samplePixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  };

  const compositeChannel = (channel: number, alpha: number) => channel * alpha + 255 * (1 - alpha);

  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const px = samplePixel(x, y);
      if (px.a < 8) continue;
      const alpha = px.a / 255;
      backgroundR += compositeChannel(px.r, alpha);
      backgroundG += compositeChannel(px.g, alpha);
      backgroundB += compositeChannel(px.b, alpha);
      edgeSampleCount += 1;
    }
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (const x of [0, width - 1]) {
      const px = samplePixel(x, y);
      if (px.a < 8) continue;
      const alpha = px.a / 255;
      backgroundR += compositeChannel(px.r, alpha);
      backgroundG += compositeChannel(px.g, alpha);
      backgroundB += compositeChannel(px.b, alpha);
      edgeSampleCount += 1;
    }
  }

  const avgBackground = edgeSampleCount
    ? {
        r: backgroundR / edgeSampleCount,
        g: backgroundG / edgeSampleCount,
        b: backgroundB / edgeSampleCount,
      }
    : { r: 255, g: 255, b: 255 };

  const backgroundTolerance = 52;
  const backgroundMask = new Uint8Array(totalPixels);
  const queue = new Uint32Array(totalPixels);
  let queueStart = 0;
  let queueEnd = 0;

  const isNearBackgroundColor = (r: number, g: number, b: number) =>
    Math.abs(r - avgBackground.r) <= backgroundTolerance &&
    Math.abs(g - avgBackground.g) <= backgroundTolerance &&
    Math.abs(b - avgBackground.b) <= backgroundTolerance;

  const enqueueIfBackground = (x: number, y: number) => {
    const pixelIndex = y * width + x;
    if (backgroundMask[pixelIndex]) return;
    const idx = pixelIndex * 4;
    const alpha = data[idx + 3] / 255;
    const compositeR = compositeChannel(data[idx], alpha);
    const compositeG = compositeChannel(data[idx + 1], alpha);
    const compositeB = compositeChannel(data[idx + 2], alpha);
    if (!isNearBackgroundColor(compositeR, compositeG, compositeB)) return;
    backgroundMask[pixelIndex] = 1;
    queue[queueEnd] = pixelIndex;
    queueEnd += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x, 0);
    enqueueIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(0, y);
    enqueueIfBackground(width - 1, y);
  }

  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart];
    queueStart += 1;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (x > 0) enqueueIfBackground(x - 1, y);
    if (x + 1 < width) enqueueIfBackground(x + 1, y);
    if (y > 0) enqueueIfBackground(x, y - 1);
    if (y + 1 < height) enqueueIfBackground(x, y + 1);
  }

  let detectedInk = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const pixelIndex = y * width + x;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const alpha = data[idx + 3] / 255;
      const compositeR = compositeChannel(r, alpha);
      const compositeG = compositeChannel(g, alpha);
      const compositeB = compositeChannel(b, alpha);
      const luminance = 0.2126 * compositeR + 0.7152 * compositeG + 0.0722 * compositeB;
      const bgDistance = Math.sqrt(
        (compositeR - avgBackground.r) ** 2 +
          (compositeG - avgBackground.g) ** 2 +
          (compositeB - avgBackground.b) ** 2,
      );

      const alphaFromDarkness = Math.max(0, Math.min(255, (210 - luminance) * 2.3));
      const alphaFromDistance = Math.max(0, Math.min(255, (bgDistance - 12) * 3.4));
      const derivedAlpha = Math.round(
        Math.max(alphaFromDarkness, alphaFromDistance, data[idx + 3] - 16),
      );

      if (backgroundMask[pixelIndex] || derivedAlpha <= 8) {
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 0;
        continue;
      }

      data[idx + 3] = derivedAlpha;
      detectedInk = true;
    }
  }

  if (detectedInk) {
    ctx.putImageData(imageData, 0, 0);
  }
}

export async function normalizeSignatureUpload(
  file: File,
  options?: { skipNormalization?: boolean },
): Promise<File> {
  if (typeof window === "undefined") return file;

  if (options?.skipNormalization) {
    return file;
  }

  const needsRasterize =
    file.type === "image/svg+xml" ||
    file.type === "image/png" ||
    file.type === "image/webp" ||
    file.type === "image/jpeg";

  if (!needsRasterize) return file;

  const image = await loadImageFromFile(file);
  const width = Math.max(image.naturalWidth || image.width || 0, 1);
  const height = Math.max(image.naturalHeight || image.height || 0, 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare signature image");

  ctx.drawImage(image, 0, 0, width, height);
  makeSignatureBackgroundTransparent(ctx, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not export signature image");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "signature";
  return new File([blob], `${baseName}.png`, {
    type: "image/png",
    lastModified: file.lastModified,
  });
}
