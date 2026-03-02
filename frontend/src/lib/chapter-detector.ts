export interface DetectedChapter {
  name: string;
  chapterNumber: number;
  content: string;
  startIndex: number;
  endIndex: number;
}

// Common chapter heading patterns in textbooks
const CHAPTER_PATTERNS = [
  // "Chapter 1: Introduction" or "Chapter 1 - Introduction"
  /^chapter\s+(\d+)\s*[:\-–—]?\s*(.+)?$/im,
  // "CHAPTER 1" (uppercase)
  /^CHAPTER\s+(\d+)\s*[:\-–—]?\s*(.+)?$/m,
  // "Unit 1: Getting Started"
  /^unit\s+(\d+)\s*[:\-–—]?\s*(.+)?$/im,
  // "Lesson 1: Basics"
  /^lesson\s+(\d+)\s*[:\-–—]?\s*(.+)?$/im,
  // "Module 1: Overview"
  /^module\s+(\d+)\s*[:\-–—]?\s*(.+)?$/im,
  // "1. Introduction" at start of line (numbered sections)
  /^(\d+)\.\s+([A-Z][a-zA-Z\s]+)$/m,
  // "Topic 1: Name"
  /^topic\s+(\d+)\s*[:\-–—]?\s*(.+)?$/im,
];

export function detectChapters(text: string): DetectedChapter[] {
  const chapters: DetectedChapter[] = [];
  const lines = text.split('\n');

  let currentChapter: Partial<DetectedChapter> | null = null;
  let currentContent: string[] = [];
  let currentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Try each pattern
    let matched = false;
    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Save previous chapter if exists
        if (currentChapter && currentChapter.chapterNumber !== undefined) {
          chapters.push({
            name: currentChapter.name || `Chapter ${currentChapter.chapterNumber}`,
            chapterNumber: currentChapter.chapterNumber,
            content: currentContent.join('\n').trim(),
            startIndex: currentStartIndex,
            endIndex: i - 1,
          });
        }

        // Start new chapter
        const chapterNumber = parseInt(match[1], 10);
        const chapterName = match[2]?.trim() || `Chapter ${chapterNumber}`;

        currentChapter = {
          name: chapterName,
          chapterNumber,
        };
        currentContent = [];
        currentStartIndex = i;
        matched = true;
        break;
      }
    }

    if (!matched && currentChapter) {
      currentContent.push(lines[i]);
    }
  }

  // Save last chapter
  if (currentChapter && currentChapter.chapterNumber !== undefined) {
    chapters.push({
      name: currentChapter.name || `Chapter ${currentChapter.chapterNumber}`,
      chapterNumber: currentChapter.chapterNumber,
      content: currentContent.join('\n').trim(),
      startIndex: currentStartIndex,
      endIndex: lines.length - 1,
    });
  }

  return chapters;
}

export function detectChapterFromFilename(filename: string): {
  name: string;
  chapterNumber: number;
} | null {
  // Try to extract chapter info from filename
  // e.g., "Chapter_5_Fractions.pdf" or "ch5-fractions.pdf"

  const patterns = [
    /chapter[_\-\s]*(\d+)[_\-\s]*(.+)?/i,
    /ch[_\-\s]*(\d+)[_\-\s]*(.+)?/i,
    /unit[_\-\s]*(\d+)[_\-\s]*(.+)?/i,
    /lesson[_\-\s]*(\d+)[_\-\s]*(.+)?/i,
  ];

  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      const chapterNumber = parseInt(match[1], 10);
      let name = match[2]?.trim().replace(/[_\-]/g, ' ') || '';

      // Capitalize first letter of each word
      if (name) {
        name = name
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      } else {
        name = `Chapter ${chapterNumber}`;
      }

      return { name, chapterNumber };
    }
  }

  return null;
}

export function suggestChapterName(
  text: string,
  filename: string,
  defaultNumber: number
): { name: string; chapterNumber: number } {
  // First try to detect from file content
  const detectedChapters = detectChapters(text);
  if (detectedChapters.length > 0) {
    return {
      name: detectedChapters[0].name,
      chapterNumber: detectedChapters[0].chapterNumber,
    };
  }

  // Try filename
  const fromFilename = detectChapterFromFilename(filename);
  if (fromFilename) {
    return fromFilename;
  }

  // Fallback: extract first meaningful line as name
  const firstLine = text
    .split('\n')
    .find((line) => line.trim().length > 10 && line.trim().length < 100);

  if (firstLine) {
    return {
      name: firstLine.trim().substring(0, 50),
      chapterNumber: defaultNumber,
    };
  }

  return {
    name: `Chapter ${defaultNumber}`,
    chapterNumber: defaultNumber,
  };
}
