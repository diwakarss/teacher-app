// ---------------------------------------------------------------------------
// Image Resolver — resolves QuestionImage specs into rendered SVG data
// ---------------------------------------------------------------------------
// All image kinds are now SVG-based (no AI API calls needed).
// ---------------------------------------------------------------------------

import type { QuestionImage, ImageKind, PaperSection } from './prompts/question-paper-prompt';
import { generateSvgFromPrompt } from './svg-generators';

const SVG_KINDS: ImageKind[] = [
  'pictogram', 'bar_chart', 'number_line', 'tally_chart', 'scratch_blocks', 'grid_path',
];

export interface ResolveProgress {
  total: number;
  completed: number;
  current: string;
}

/**
 * Resolve a single QuestionImage — fills in svgData.
 * Returns a new QuestionImage (does not mutate the original).
 */
export function resolveImage(image: QuestionImage): QuestionImage {
  if (SVG_KINDS.includes(image.kind)) {
    const svgData = generateSvgFromPrompt(image.kind, image.prompt);
    return { ...image, svgData };
  }
  return image;
}

/**
 * Resolve all images in a question paper's sections.
 * All SVG — resolves instantly, no async needed (kept async for API compat).
 */
export async function resolveAllImages(
  sections: PaperSection[],
  onProgress?: (progress: ResolveProgress) => void,
): Promise<PaperSection[]> {
  const allImages: { sIdx: number; qIdx: number; image: QuestionImage }[] = [];
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    for (let qIdx = 0; qIdx < sections[sIdx].questions.length; qIdx++) {
      const q = sections[sIdx].questions[qIdx];
      if (q.image && !q.image.svgData && !q.image.base64Data) {
        allImages.push({ sIdx, qIdx, image: q.image });
      }
    }
  }

  if (allImages.length === 0) return sections;

  const resolved = JSON.parse(JSON.stringify(sections)) as PaperSection[];

  let completed = 0;
  for (const { sIdx, qIdx, image } of allImages) {
    onProgress?.({
      total: allImages.length,
      completed,
      current: `Generating ${image.kind}: ${image.alt}`,
    });

    resolved[sIdx].questions[qIdx].image = resolveImage(image);
    completed++;
  }

  onProgress?.({
    total: allImages.length,
    completed: allImages.length,
    current: 'Done',
  });

  return resolved;
}

/**
 * Check if a question image has been resolved (has SVG or base64 data).
 */
export function isImageResolved(image: QuestionImage): boolean {
  return !!(image.svgData || image.base64Data);
}

/**
 * Get a data URL for a resolved image (for use in <img> src).
 */
export function getImageDataUrl(image: QuestionImage): string | null {
  if (image.svgData) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image.svgData)}`;
  }
  if (image.base64Data) {
    return `data:image/png;base64,${image.base64Data}`;
  }
  return null;
}
