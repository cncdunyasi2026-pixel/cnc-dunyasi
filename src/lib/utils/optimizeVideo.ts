/**
 * Video doğrulaması formda yapılır. Tarayıcıda transcode (videoyu baştan sona oynatma)
 * yükleme süresini video uzunluğu kadar uzatır; bu yüzden dosya olduğu gibi yüklenir.
 */
export async function optimizeVideo(file: File): Promise<File> {
  return file;
}
