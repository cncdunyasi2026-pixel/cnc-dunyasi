export const MAX_VIDEO_DURATION_SEC = 60;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_VIDEO_MB = MAX_VIDEO_BYTES / (1024 * 1024);
export const VIDEO_OPTIMIZE_TARGET_MB = 6;

const ACCEPTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);

export function isAcceptedVideoType(type: string): boolean {
  return ACCEPTED_VIDEO_TYPES.has(type) || type.startsWith("video/");
}

async function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Video süresi okunamadı."));
        return;
      }
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video okunamadı."));
    };
    video.src = url;
  });
}

export async function validateVideoFile(file: File): Promise<void> {
  if (!isAcceptedVideoType(file.type)) {
    throw new Error("Yalnızca MP4, WebM veya MOV video yüklenebilir.");
  }

  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`Video en fazla ${MAX_VIDEO_MB} MB olabilir.`);
  }

  const durationSec = await readVideoDuration(file);
  if (durationSec > MAX_VIDEO_DURATION_SEC + 0.25) {
    throw new Error("Video en fazla 1 dakika olabilir.");
  }
}
