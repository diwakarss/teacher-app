/**
 * Document Formatter Utility
 *
 * Parse Word documents with mammoth.js, apply formatting rules,
 * and generate new documents with docx library.
 */

import mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

export interface FormattingPreset {
  id: string;
  name: string;
  rules: FormattingRules;
  createdAt: string;
  updatedAt: string;
}

export interface FormattingRules {
  headingFont: string;
  headingSize: number; // pt
  bodyFont: string;
  bodySize: number; // pt
  lineSpacing: number; // multiplier (1.0, 1.5, 2.0)
  margins: {
    top: number; // inches
    bottom: number;
    left: number;
    right: number;
  };
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface ParsedDocument {
  html: string;
  text: string;
  messages: string[];
  elements: ParsedElement[];
}

export interface ParsedElement {
  type: 'heading' | 'paragraph' | 'list-item';
  level?: number; // for headings (1-6)
  text: string;
}

const DEFAULT_RULES: FormattingRules = {
  headingFont: 'Arial',
  headingSize: 14,
  bodyFont: 'Times New Roman',
  bodySize: 12,
  lineSpacing: 1.5,
  margins: { top: 1, bottom: 1, left: 1, right: 1 },
  alignment: 'justify',
};

const PRESET_STORAGE_KEY = 'doc-formatter-presets';

/**
 * Parse a .docx file and extract content
 */
export async function parseDocx(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  // Parse HTML to extract structured elements
  const elements = parseHtmlToElements(result.value);

  return {
    html: result.value,
    text: textResult.value,
    messages: result.messages.map((m) => m.message),
    elements,
  };
}

/**
 * Parse HTML string to structured elements
 */
function parseHtmlToElements(html: string): ParsedElement[] {
  const elements: ParsedElement[] = [];

  // Use regex to extract elements (browser-safe, no DOM parser needed)
  const tagRegex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2].replace(/<[^>]+>/g, '').trim(); // Strip inner HTML

    if (!content) continue;

    if (tag.startsWith('h')) {
      elements.push({
        type: 'heading',
        level: parseInt(tag[1]),
        text: content,
      });
    } else if (tag === 'li') {
      elements.push({
        type: 'list-item',
        text: content,
      });
    } else {
      elements.push({
        type: 'paragraph',
        text: content,
      });
    }
  }

  // If no elements found, split by newlines
  if (elements.length === 0) {
    const lines = html.replace(/<[^>]+>/g, '\n').split('\n').filter(Boolean);
    for (const line of lines) {
      elements.push({ type: 'paragraph', text: line.trim() });
    }
  }

  return elements;
}

/**
 * Apply formatting rules and generate new .docx
 */
export async function applyFormatting(
  parsed: ParsedDocument,
  rules: FormattingRules = DEFAULT_RULES
): Promise<Blob> {
  const children: Paragraph[] = [];

  for (const element of parsed.elements) {
    if (element.type === 'heading') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: element.text,
              font: rules.headingFont,
              size: rules.headingSize * 2, // docx uses half-points
              bold: true,
            }),
          ],
          heading: getHeadingLevel(element.level || 1),
          spacing: { after: 200, line: rules.lineSpacing * 240 },
        })
      );
    } else if (element.type === 'list-item') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${element.text}`,
              font: rules.bodyFont,
              size: rules.bodySize * 2,
            }),
          ],
          spacing: { after: 120, line: rules.lineSpacing * 240 },
          indent: { left: convertInchesToTwip(0.5) },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: element.text,
              font: rules.bodyFont,
              size: rules.bodySize * 2,
            }),
          ],
          alignment: getAlignment(rules.alignment),
          spacing: { after: 200, line: rules.lineSpacing * 240 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(rules.margins.top),
              bottom: convertInchesToTwip(rules.margins.bottom),
              left: convertInchesToTwip(rules.margins.left),
              right: convertInchesToTwip(rules.margins.right),
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

function getHeadingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    default:
      return HeadingLevel.HEADING_6;
  }
}

function getAlignment(align: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

/**
 * Download formatted document
 */
export function downloadDocument(blob: Blob, filename: string): void {
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}

/**
 * Get default formatting rules
 */
export function getDefaultRules(): FormattingRules {
  return { ...DEFAULT_RULES };
}

/**
 * Save formatting preset to localStorage
 */
export function savePreset(preset: FormattingPreset): void {
  const presets = getPresets();
  const index = presets.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    presets[index] = preset;
  } else {
    presets.push(preset);
  }
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

/**
 * Get all formatting presets
 */
export function getPresets(): FormattingPreset[] {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultPresets();
  } catch {
    return getDefaultPresets();
  }
}

/**
 * Delete a formatting preset
 */
export function deletePreset(id: string): void {
  const presets = getPresets().filter((p) => p.id !== id);
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

/**
 * Get default presets
 */
function getDefaultPresets(): FormattingPreset[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'default-worksheet',
      name: 'Worksheet',
      rules: {
        headingFont: 'Arial',
        headingSize: 16,
        bodyFont: 'Arial',
        bodySize: 12,
        lineSpacing: 1.5,
        margins: { top: 1, bottom: 1, left: 1, right: 1 },
        alignment: 'left',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'default-exam',
      name: 'Exam Paper',
      rules: {
        headingFont: 'Times New Roman',
        headingSize: 14,
        bodyFont: 'Times New Roman',
        bodySize: 12,
        lineSpacing: 1.15,
        margins: { top: 0.75, bottom: 0.75, left: 1, right: 1 },
        alignment: 'justify',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'default-handout',
      name: 'Handout',
      rules: {
        headingFont: 'Calibri',
        headingSize: 14,
        bodyFont: 'Calibri',
        bodySize: 11,
        lineSpacing: 1.0,
        margins: { top: 0.5, bottom: 0.5, left: 0.75, right: 0.75 },
        alignment: 'left',
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}
