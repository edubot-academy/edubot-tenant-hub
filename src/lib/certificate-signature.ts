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

export async function normalizeSignatureUpload(file: File): Promise<File> {
  if (typeof window === "undefined") return file;

  const needsRasterize =
    file.type === "image/svg+xml" ||
    file.type === "image/png" ||
    file.type === "image/webp";

  if (!needsRasterize) return file;

  const image = await loadImageFromFile(file);
  const width = Math.max(image.naturalWidth || image.width || 0, 1);
  const height = Math.max(image.naturalHeight || image.height || 0, 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare signature image");

  // Flatten transparency onto white to avoid black backgrounds in downstream renderers.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not export signature image");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "signature";
  return new File([blob], `${baseName}.png`, {
    type: "image/png",
    lastModified: file.lastModified,
  });
}
