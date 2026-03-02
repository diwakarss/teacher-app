import Tesseract, { createWorker, type Worker } from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

// Singleton worker for reuse
let worker: Worker | null = null;
let workerInitializing = false;
let initPromise: Promise<Worker> | null = null;

async function getWorker(
  onProgress?: (progress: OCRProgress) => void
): Promise<Worker> {
  if (worker) return worker;

  if (workerInitializing && initPromise) {
    return initPromise;
  }

  workerInitializing = true;
  initPromise = createWorker('eng', Tesseract.OEM.LSTM_ONLY, {
    logger: (m) => {
      if (onProgress && m.status && typeof m.progress === 'number') {
        onProgress({
          status: m.status,
          progress: Math.round(m.progress * 100),
        });
      }
    },
  });

  worker = await initPromise;
  workerInitializing = false;
  return worker;
}

export async function extractTextFromImage(
  imageSource: File | Blob | string,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const w = await getWorker(onProgress);

  // Convert File to data URL for Tesseract
  let source: string;
  if (imageSource instanceof File || imageSource instanceof Blob) {
    source = await blobToDataURL(imageSource);
  } else {
    source = imageSource;
  }

  const result = await w.recognize(source);

  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
  };
}

export async function extractTextFromImages(
  images: (File | Blob | string)[],
  onProgress?: (progress: OCRProgress & { currentImage: number; totalImages: number }) => void
): Promise<OCRResult> {
  const results: string[] = [];
  let totalConfidence = 0;

  for (let i = 0; i < images.length; i++) {
    const result = await extractTextFromImage(images[i], (p) => {
      onProgress?.({
        ...p,
        currentImage: i + 1,
        totalImages: images.length,
      });
    });
    results.push(result.text);
    totalConfidence += result.confidence;
  }

  return {
    text: results.join('\n\n'),
    confidence: totalConfidence / images.length,
  };
}

export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    initPromise = null;
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Pre-warm the worker on idle (optional call)
export async function warmupOCR(): Promise<void> {
  await getWorker();
}
