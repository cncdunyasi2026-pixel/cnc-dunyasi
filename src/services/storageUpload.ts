import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { validateVideoFile } from "@/lib/constants/videoUpload";
import { isFirebaseClientConfigured, storage } from "@/lib/firebase";

const MAX_BYTES = 5 * 1024 * 1024;
const TARGET_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1920;

export type UploadedImage = {
  url: string;
  path: string;
};

export type UploadedVideo = {
  url: string;
  path: string;
};

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gorsel okunamadi."));
    };
    img.src = url;
  });
}

function computeScaledSize(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_DIMENSION) {
    return { width, height };
  }
  const ratio = MAX_DIMENSION / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gorsel sikistirma basarisiz."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function optimizeImage(file: File): Promise<File> {
  const img = await loadImage(file);
  const scaled = computeScaledSize(img.width, img.height);
  const needsResize = scaled.width !== img.width || scaled.height !== img.height;
  const needsCompression = file.size > TARGET_BYTES;
  if (!needsResize && !needsCompression) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }
  ctx.drawImage(img, 0, 0, scaled.width, scaled.height);

  const isJpegLike = file.type === "image/jpeg" || file.type === "image/jpg";
  const supportsWebp = file.type === "image/webp" || file.type === "image/png" || isJpegLike;
  const outputType = supportsWebp ? "image/webp" : "image/jpeg";
  let bestBlob = await canvasToBlob(canvas, outputType, 0.92);

  if (bestBlob.size > TARGET_BYTES) {
    for (const quality of [0.88, 0.84, 0.8, 0.76, 0.72]) {
      const blob = await canvasToBlob(canvas, outputType, quality);
      bestBlob = blob;
      if (blob.size <= TARGET_BYTES) break;
    }
  }

  if (bestBlob.size >= file.size) {
    return file;
  }

  const extension = outputType === "image/webp" ? ".webp" : ".jpg";
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const optimizedName = `${baseName}-opt${extension}`;
  return new File([bestBlob], optimizedName, { type: outputType });
}

export async function uploadUserImagesWithPaths(
  files: File[],
  folderPath: string,
): Promise<UploadedImage[]> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Gorsel yuklemek icin .env.local tanimlayin.");
  }

  const uploaded: UploadedImage[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Yalnızca resim dosyaları yüklenebilir.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Her görsel en fazla 5 MB olabilir.");
    }

    const optimized = await optimizeImage(file);
    const safe = optimized.name.replace(/[^\w.\-]/g, "_");
    const objectName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
    const storageRef = ref(storage, `${folderPath}/${objectName}`);
    const uploadResult = await uploadBytes(storageRef, optimized);
    uploaded.push({
      url: await getDownloadURL(storageRef),
      path: uploadResult.metadata.fullPath,
    });
  }

  return uploaded;
}

export async function uploadUserImages(files: File[], folderPath: string): Promise<string[]> {
  const uploaded = await uploadUserImagesWithPaths(files, folderPath);
  return uploaded.map((item) => item.url);
}

export async function uploadUserVideoWithPath(
  file: File,
  folderPath: string,
): Promise<UploadedVideo> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Video yuklemek icin .env.local tanimlayin.");
  }

  await validateVideoFile(file);

  const safe = file.name.replace(/[^\w.\-]/g, "_");
  const objectName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
  const storageRef = ref(storage, `${folderPath}/${objectName}`);
  const uploadResult = await uploadBytes(storageRef, file);

  return {
    url: await getDownloadURL(storageRef),
    path: uploadResult.metadata.fullPath,
  };
}
