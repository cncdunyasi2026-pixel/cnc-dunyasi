import { MAX_VIDEO_DURATION_SEC } from "@/lib/constants/videoUpload";

/** Görsellerle aynı üst sınır */
const MAX_DIMENSION = 1920;
/** Bu boyutun altındaysa ve çözünürlük uygunsa dokunma */
const SKIP_IF_UNDER_BYTES = 6 * 1024 * 1024;
/** Sıkıştırma sonrası üst sınır — kaliteyi korumak için agresif küçültme yok */
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const RECORD_FPS = 30;

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

/** Yüksekten düşüğe — ilk uygun sonuç = en iyi kalite */
const BITRATES = [4_000_000, 3_200_000, 2_500_000] as const;

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

async function pumpVideoFrames(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): Promise<void> {
  const draw = () => {
    ctx.drawImage(video, 0, 0, width, height);
  };

  if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
    await new Promise<void>((resolve) => {
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
    return;
  }

  await new Promise<void>((resolve) => {
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

    if (video.duration > MAX_VIDEO_DURATION_SEC + 0.25) {
      throw new Error("Video en fazla 1 dakika olabilir.");
    }

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
      await pumpVideoFrames(video, ctx, scaled.width, scaled.height);
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
    await new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new Error("Video oynatılamadı."));
    });
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

/** Çok küçük çıktı (ör. 300 KB) kaliteyi bozar — orijinale dön */
function isOutputTooAggressive(originalBytes: number, outputBytes: number, durationSec: number): boolean {
  const minExpected = Math.min(originalBytes * 0.35, (durationSec / 60) * 2 * 1024 * 1024);
  return outputBytes < Math.max(1.5 * 1024 * 1024, minExpected);
}

/**
 * Videoyu makul boyuta indirir; kalite önceliklidir.
 * Desteklenmiyorsa orijinal dosyayı döndürür.
 */
export async function optimizeVideo(file: File): Promise<File> {
  const mimeType = pickRecorderMimeType();
  if (!mimeType) {
    return file;
  }

  const { longestSide, durationSec } = await readVideoMeta(file);
  const needsCompression = file.size > SKIP_IF_UNDER_BYTES || longestSide > MAX_DIMENSION;

  if (!needsCompression) {
    return file;
  }

  for (const bitrate of BITRATES) {
    const blob = await transcodeWithBitrate(file, mimeType, bitrate);

    if (isOutputTooAggressive(file.size, blob.size, durationSec)) {
      continue;
    }

    if (blob.size <= MAX_OUTPUT_BYTES && blob.size < file.size) {
      return toOutputFile(blob, file.name, mimeType);
    }
  }

  return file;
}

export const VIDEO_OPTIMIZE_MAX_MB = MAX_OUTPUT_BYTES / (1024 * 1024);
