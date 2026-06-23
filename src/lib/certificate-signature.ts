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

  let backgroundCount = 0;
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

  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const px = samplePixel(x, y);
      if (px.a < 32) continue;
      backgroundR += px.r;
      backgroundG += px.g;
      backgroundB += px.b;
      backgroundCount += 1;
    }
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (const x of [0, width - 1]) {
      const px = samplePixel(x, y);
      if (px.a < 32) continue;
      backgroundR += px.r;
      backgroundG += px.g;
      backgroundB += px.b;
      backgroundCount += 1;
    }
  }

  const avgBackground = backgroundCount
    ? {
        r: backgroundR / backgroundCount,
        g: backgroundG / backgroundCount,
        b: backgroundB / backgroundCount,
      }
    : { r: 255, g: 255, b: 255 };

  let detectedInk = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const alpha = data[idx + 3] / 255;
      const compositeR = r * alpha + 255 * (1 - alpha);
      const compositeG = g * alpha + 255 * (1 - alpha);
      const compositeB = b * alpha + 255 * (1 - alpha);
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

      if (derivedAlpha <= 8) {
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

export async function normalizeSignatureUpload(file: File): Promise<File> {
  if (typeof window === "undefined") return file;

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
