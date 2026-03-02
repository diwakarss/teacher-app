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

// Store the loaded PDF document for potential re-rendering
let cachedPdf: import('pdfjs-dist').PDFDocumentProxy | null = null;

export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: PDFExtractionProgress) => void
): Promise<PDFExtractionResult> {
  const pdfjs = await getPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  // Cache for potential OCR fallback
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
  // If total text length is very short relative to page count,
  // the PDF likely doesn't have an embedded text layer
  const avgCharsPerPage = text.length / pageCount;
  return avgCharsPerPage > 50; // Threshold: at least 50 chars per page average
}

export function hasTextLayer(result: PDFExtractionResult): boolean {
  return result.hasTextLayer;
}

/**
 * Render PDF pages to images for OCR fallback
 * Returns array of Blob images
 */
export async function renderPdfPagesToImages(
  file?: File,
  onProgress?: (progress: PDFExtractionProgress) => void,
  scale: number = 2.0 // Higher scale = better OCR accuracy
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
    throw new Error('No PDF loaded. Call extractTextFromPDF first or provide a file.');
  }

  const totalPages = pdf.numPages;
  const images: Blob[] = [];

  for (let i = 1; i <= totalPages; i++) {
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

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob from canvas'));
        },
        'image/png',
        0.95
      );
    });

    images.push(blob);

    if (onProgress) {
      onProgress({
        currentPage: i,
        totalPages,
        percentage: Math.round((i / totalPages) * 100),
        phase: 'rendering',
      });
    }
  }

  return images;
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
