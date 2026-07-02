import { MAX_VIDEO_DURATION_SEC } from "@/lib/constants/videoUpload";

const MAX_DIMENSION = 1920;
/** Bu boyutun altında ve çözünürlük uygunsa sıkıştırma yapma — yükleme hızlı kalır */
const SKIP_IF_UNDER_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const RECORD_FPS = 30;
const MAX_TRANSCODE_MS = 90_000;

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function pickRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function scaleVideoSize(width: number, height: number) {
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

function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Video okunamadı."));
  });
}

function transcodeTimeoutMs(durationSec: number): number {
  const playbackMs = Math.ceil(Math.max(durationSec, 1) * 1000) + 15_000;
  return Math.min(MAX_TRANSCODE_MS, playbackMs);
}

function waitForVideoEnd(video: HTMLVideoElement, timeoutMs: number): Promise<void> {
  if (video.ended) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Video sıkıştırma zaman aşımına uğradı."));
    }, timeoutMs);

    const onEnd = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Video oynatılamadı."));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("ended", onEnd);
      video.removeEventListener("error", onErr);
    };

    video.addEventListener("ended", onEnd);
    video.addEventListener("error", onErr);
  });
}

async function pumpVideoFrames(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeoutMs: number,
): Promise<void> {
  const draw = () => ctx.drawImage(video, 0, 0, width, height);

  const endPromise = waitForVideoEnd(video, timeoutMs);

  if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
    const framePromise = new Promise<void>((resolve) => {
      const step = () => {
        if (video.ended) {
          resolve();
          return;
        }
        draw();
        video.requestVideoFrameCallback(step);
      };
      step();
    });
    await Promise.race([framePromise, endPromise]);
    return;
  }

  const framePromise = new Promise<void>((resolve) => {
    const step = () => {
      if (video.ended) {
        resolve();
        return;
      }
      draw();
      requestAnimationFrame(step);
    };
    step();
  });
  await Promise.race([framePromise, endPromise]);
}

function pickBitrate(fileBytes: number, durationSec: number): number {
  const targetBytes = Math.min(MAX_OUTPUT_BYTES, fileBytes * 0.65);
  const bitsPerSecond = (targetBytes * 8) / Math.max(durationSec, 1);
  return Math.min(4_000_000, Math.max(2_000_000, Math.round(bitsPerSecond)));
}

async function transcodeWithBitrate(
  file: File,
  mimeType: string,
  bitrate: number,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await waitForVideoMetadata(video);

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("Video süresi okunamadı.");
    }
    if (video.duration > MAX_VIDEO_DURATION_SEC + 0.25) {
      throw new Error("Video en fazla 1 dakika olabilir.");
    }

    const timeoutMs = transcodeTimeoutMs(video.duration);
    const scaled = scaleVideoSize(video.videoWidth, video.videoHeight);
    const needsResize =
      scaled.width !== video.videoWidth || scaled.height !== video.videoHeight;

    let stream: MediaStream;

    if (needsResize) {
      const canvas = document.createElement("canvas");
      canvas.width = scaled.width;
      canvas.height = scaled.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Video işlenemedi.");
      }
      stream = canvas.captureStream(RECORD_FPS);

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });

      const blobPromise = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = () => reject(new Error("Video sıkıştırma başarısız."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start(250);
      video.currentTime = 0;
      await video.play();
      await pumpVideoFrames(video, ctx, scaled.width, scaled.height, timeoutMs);
      recorder.stop();
      return await blobPromise;
    }

    const videoWithCapture = video as HTMLVideoElement & {
      captureStream?: (fps?: number) => MediaStream;
      mozCaptureStream?: (fps?: number) => MediaStream;
    };
    const capture = videoWithCapture.captureStream ?? videoWithCapture.mozCaptureStream;
    if (!capture) {
      throw new Error("Video akışı alınamadı.");
    }
    stream = capture.call(video, RECORD_FPS);

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    const blobPromise = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("Video sıkıştırma başarısız."));
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    recorder.start(250);
    video.currentTime = 0;
    await video.play();
    await waitForVideoEnd(video, timeoutMs);
    recorder.stop();
    return await blobPromise;
  } finally {
    video.pause();
    URL.revokeObjectURL(url);
  }
}

function toOutputFile(blob: Blob, originalName: string, mimeType: string): File {
  const extension = mimeType.includes("mp4") ? ".mp4" : ".webm";
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  return new File([blob], `${baseName}-opt${extension}`, { type: mimeType });
}

async function readVideoMeta(file: File): Promise<{ longestSide: number; durationSec: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = url;

  try {
    await waitForVideoMetadata(video);
    return {
      longestSide: Math.max(video.videoWidth, video.videoHeight),
      durationSec: video.duration,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Büyük videoları tek geçişte sıkıştırır; hata veya zaman aşımında orijinal dosyayı döndürür.
 */
export async function optimizeVideo(file: File): Promise<File> {
  try {
    const mimeType = pickRecorderMimeType();
    if (!mimeType) {
      return file;
    }

    const { longestSide, durationSec } = await readVideoMeta(file);
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      return file;
    }

    const needsCompression = file.size > SKIP_IF_UNDER_BYTES || longestSide > MAX_DIMENSION;
    if (!needsCompression) {
      return file;
    }

    const bitrate = pickBitrate(file.size, durationSec);
    const blob = await transcodeWithBitrate(file, mimeType, bitrate);

    if (blob.size === 0 || blob.size >= file.size) {
      return file;
    }

    if (blob.size <= MAX_OUTPUT_BYTES) {
      return toOutputFile(blob, file.name, mimeType);
    }

    return file;
  } catch (err) {
    console.warn("[optimizeVideo] Orijinal video kullanılıyor:", err);
    return file;
  }
}

export const VIDEO_OPTIMIZE_MAX_MB = MAX_OUTPUT_BYTES / (1024 * 1024);
