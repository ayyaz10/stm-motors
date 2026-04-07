export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/jpeg" | "image/webp";
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.78,
  outputType: "image/jpeg",
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = imageUrl;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputType: "image/jpeg" | "image/webp",
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }

        resolve(blob);
      },
      outputType,
      quality,
    );
  });
}

export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const image = await loadImage(file);
  const widthRatio = settings.maxWidth / image.width;
  const heightRatio = settings.maxHeight / image.height;
  const scale = Math.min(widthRatio, heightRatio, 1);
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(targetWidth, targetHeight);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image compression is not supported on this device.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(
    canvas,
    settings.outputType,
    settings.quality,
  );
  const outputExtension = settings.outputType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "vehicle-check";

  return new File([blob], `${baseName}.${outputExtension}`, {
    type: settings.outputType,
    lastModified: Date.now(),
  });
}
