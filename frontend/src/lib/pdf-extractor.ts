export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  pages: string[];
  hasTextLayer: boolean;
}

export interface PDFExtractionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  phase?: 'extracting' | 'rendering';
}

// Lazy-load PDF.js to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  pdfjsLib = await import('pdfjs-dist');

  // Configure worker - use CDN to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  return pdfjsLib;
}

// Module-scope cached PDF document (managed by pdf-session-store metadata)
let cachedPdf: import('pdfjs-dist').PDFDocumentProxy | null = null;

/**
 * Load a PDF file into the module-scope cache.
 * Returns the total page count.
 */
export async function loadPdf(file: File): Promise<number> {
  const pdfjs = await getPdfJs();

  // Destroy previous cached PDF if any
  if (cachedPdf) {
    cachedPdf.destroy();
  }

  const arrayBuffer = await file.arrayBuffer();
  cachedPdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return cachedPdf.numPages;
}

/**
 * Check if a PDF is currently loaded in cache
 */
export function isPdfLoaded(): boolean {
  return cachedPdf !== null;
}

/**
 * Get total page count of the cached PDF
 */
export function getCachedPageCount(): number {
  return cachedPdf?.numPages ?? 0;
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: PDFExtractionProgress) => void
): Promise<PDFExtractionResult> {
  const pdfjs = await getPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  // Cache for reuse
  cachedPdf = pdf;

  const totalPages = pdf.numPages;
  const pages: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Extract text items and join with appropriate spacing
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) {
          return item.str;
        }
        return '';
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push(pageText);

    if (onProgress) {
      onProgress({
        currentPage: i,
        totalPages,
        percentage: Math.round((i / totalPages) * 100),
        phase: 'extracting',
      });
    }
  }

  const text = pages.join('\n\n');
  const hasText = checkHasTextLayer(text, totalPages);

  return {
    text,
    pageCount: totalPages,
    pages,
    hasTextLayer: hasText,
  };
}

function checkHasTextLayer(text: string, pageCount: number): boolean {
  const avgCharsPerPage = text.length / pageCount;
  return avgCharsPerPage > 50;
}

export function hasTextLayer(result: PDFExtractionResult): boolean {
  return result.hasTextLayer;
}

/**
 * Render a range of PDF pages to JPEG images.
 * Uses sequential render-and-release to minimize canvas memory pressure on mobile.
 */
export async function renderPdfPagesToImages(
  file?: File,
  onProgress?: (progress: PDFExtractionProgress) => void,
  scale: number = 2.0,
  startPage?: number,
  endPage?: number
): Promise<Blob[]> {
  const pdfjs = await getPdfJs();

  // Use cached PDF or load from file
  let pdf = cachedPdf;
  if (!pdf && file) {
    const arrayBuffer = await file.arrayBuffer();
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    cachedPdf = pdf;
  }

  if (!pdf) {
    throw new Error('No PDF loaded. Call loadPdf first or provide a file.');
  }

  const totalPages = pdf.numPages;
  const start = Math.max(1, startPage ?? 1);
  const end = Math.min(totalPages, endPage ?? totalPages);
  const pageCount = end - start + 1;

  const images: Blob[] = [];

  for (let i = start; i <= end; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // Convert canvas to JPEG blob (smaller than PNG for vision API)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob from canvas'));
        },
        'image/jpeg',
        0.8
      );
    });

    // Release canvas memory immediately (prevents OOM on mobile)
    canvas.width = 0;
    canvas.height = 0;

    images.push(blob);

    if (onProgress) {
      onProgress({
        currentPage: i - start + 1,
        totalPages: pageCount,
        percentage: Math.round(((i - start + 1) / pageCount) * 100),
        phase: 'rendering',
      });
    }
  }

  return images;
}

/**
 * Render a single page to a JPEG data URL for preview display
 */
export async function renderPageToDataUrl(
  pageNumber: number,
  scale: number = 1.5
): Promise<string> {
  if (!cachedPdf) {
    throw new Error('No PDF loaded. Call loadPdf first.');
  }

  const page = await cachedPdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

  // Release canvas
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

/**
 * Render a single page to a base64 string (no data: prefix) for API calls
 */
export async function renderPageToBase64(
  pageNumber: number,
  scale: number = 2.0
): Promise<string> {
  const dataUrl = await renderPageToDataUrl(pageNumber, scale);
  // Strip "data:image/jpeg;base64," prefix
  return dataUrl.split(',')[1];
}

/**
 * Clear the cached PDF to free memory
 */
export function clearPdfCache(): void {
  if (cachedPdf) {
    cachedPdf.destroy();
    cachedPdf = null;
  }
}
