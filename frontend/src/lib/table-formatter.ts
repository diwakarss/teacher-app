/**
 * Table Formatter Utility
 *
 * Format tables in Word documents by modifying XML directly.
 * Preserves all existing content, fonts, borders, and styles.
 * Only modifies column widths and vertical alignment.
 */

import JSZip from 'jszip';

// Column widths in twips (1 inch = 1440 twips)
const COLUMN_WIDTHS = {
  dayDate: 1440,    // 1 inch - fits "Wednesday"
  subject: 1800,    // ~1.25 inch - single words fit, two-word wrap
  content: 6120,    // Remaining space (~4.25 inch)
};

// Total table width (US Letter 8.5" - 2" margins = 6.5" = 9360 twips)
const TOTAL_WIDTH = COLUMN_WIDTHS.dayDate + COLUMN_WIDTHS.subject + COLUMN_WIDTHS.content;

export interface TableFormatResult {
  blob: Blob;
  tablesFound: number;
  tablesFormatted: number;
}

/**
 * Extract document.xml from a .docx file
 */
async function extractDocumentXml(file: File): Promise<{ zip: JSZip; xml: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentXml = zip.file('word/document.xml');
  if (!documentXml) {
    throw new Error('Invalid .docx file: word/document.xml not found');
  }

  const xml = await documentXml.async('string');
  return { zip, xml };
}

/**
 * Count tables in the document
 */
function countTables(xml: string): number {
  const matches = xml.match(/<w:tbl[^>]*>/g);
  return matches ? matches.length : 0;
}

/**
 * Apply column width formatting to tables
 *
 * Modifies <w:tcW> elements within table cells to set explicit widths.
 * Assumes 3-column lesson plan tables (Day/Date, Subject, Content).
 */
function formatTableWidths(xml: string): string {
  // Match each table
  let result = xml;
  const tableRegex = /<w:tbl[^>]*>([\s\S]*?)<\/w:tbl>/g;

  result = result.replace(tableRegex, (tableMatch) => {
    // Process each row in the table
    const rowRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/g;

    return tableMatch.replace(rowRegex, (rowMatch) => {
      // Find all cells in this row
      const cellRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/g;
      let cellIndex = 0;

      return rowMatch.replace(cellRegex, (cellMatch) => {
        // Determine width based on column index
        let width: number;
        if (cellIndex === 0) {
          width = COLUMN_WIDTHS.dayDate;
        } else if (cellIndex === 1) {
          width = COLUMN_WIDTHS.subject;
        } else {
          width = COLUMN_WIDTHS.content;
        }
        cellIndex++;

        // Replace or add cell width property
        const widthElement = `<w:tcW w:w="${width}" w:type="dxa"/>`;

        // Check if tcPr exists
        if (cellMatch.includes('<w:tcPr>')) {
          // Replace existing tcW or add if missing
          if (cellMatch.includes('<w:tcW')) {
            return cellMatch.replace(/<w:tcW[^/]*\/>/, widthElement);
          } else {
            // Add tcW after tcPr opening tag
            return cellMatch.replace(/<w:tcPr>/, `<w:tcPr>${widthElement}`);
          }
        } else {
          // Add tcPr with tcW after tc opening tag
          return cellMatch.replace(/<w:tc([^>]*)>/, `<w:tc$1><w:tcPr>${widthElement}</w:tcPr>`);
        }
      });
    });
  });

  return result;
}

/**
 * Apply vertical alignment (top) to all table cells
 */
function formatVerticalAlignment(xml: string): string {
  let result = xml;
  const tableRegex = /<w:tbl[^>]*>([\s\S]*?)<\/w:tbl>/g;

  result = result.replace(tableRegex, (tableMatch) => {
    const cellRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/g;

    return tableMatch.replace(cellRegex, (cellMatch) => {
      const vAlignElement = '<w:vAlign w:val="top"/>';

      // Check if tcPr exists
      if (cellMatch.includes('<w:tcPr>')) {
        // Replace existing vAlign or add if missing
        if (cellMatch.includes('<w:vAlign')) {
          return cellMatch.replace(/<w:vAlign[^/]*\/>/, vAlignElement);
        } else {
          // Add vAlign before tcPr closing tag
          return cellMatch.replace(/<\/w:tcPr>/, `${vAlignElement}</w:tcPr>`);
        }
      } else {
        // Add tcPr with vAlign after tc opening tag
        return cellMatch.replace(/<w:tc([^>]*)>/, `<w:tc$1><w:tcPr>${vAlignElement}</w:tcPr>`);
      }
    });
  });

  return result;
}

/**
 * Set table width property to match column sum
 */
function formatTableWidth(xml: string): string {
  let result = xml;
  const tableRegex = /<w:tbl[^>]*>([\s\S]*?)<\/w:tbl>/g;

  result = result.replace(tableRegex, (tableMatch) => {
    const tblWidthElement = `<w:tblW w:w="${TOTAL_WIDTH}" w:type="dxa"/>`;

    // Check if tblPr exists
    if (tableMatch.includes('<w:tblPr>')) {
      // Replace existing tblW or add if missing
      if (tableMatch.includes('<w:tblW')) {
        return tableMatch.replace(/<w:tblW[^/]*\/>/, tblWidthElement);
      } else {
        // Add tblW after tblPr opening tag
        return tableMatch.replace(/<w:tblPr>/, `<w:tblPr>${tblWidthElement}`);
      }
    } else {
      // Add tblPr with tblW after tbl opening tag
      return tableMatch.replace(/<w:tbl([^>]*)>/, `<w:tbl$1><w:tblPr>${tblWidthElement}</w:tblPr>`);
    }
  });

  return result;
}

/**
 * Repackage modified XML back into .docx
 */
async function repackageDocument(zip: JSZip, xml: string): Promise<Blob> {
  zip.file('word/document.xml', xml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

/**
 * Main entry point: Format tables in a .docx file
 *
 * Applies:
 * - Fixed column widths (Day/Date: 1", Subject: 1.25", Content: remaining)
 * - Vertical alignment: top for all cells
 * - Table width: sum of column widths
 *
 * Preserves all existing content, fonts, borders, and styles.
 */
export async function formatTables(file: File): Promise<TableFormatResult> {
  // Extract document.xml
  const { zip, xml } = await extractDocumentXml(file);

  // Count tables
  const tablesFound = countTables(xml);

  if (tablesFound === 0) {
    // No tables - return original file as blob
    const originalBuffer = await file.arrayBuffer();
    return {
      blob: new Blob([originalBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      tablesFound: 0,
      tablesFormatted: 0,
    };
  }

  // Apply formatting
  let modifiedXml = xml;
  modifiedXml = formatTableWidth(modifiedXml);
  modifiedXml = formatTableWidths(modifiedXml);
  modifiedXml = formatVerticalAlignment(modifiedXml);

  // Repackage
  const blob = await repackageDocument(zip, modifiedXml);

  return {
    blob,
    tablesFound,
    tablesFormatted: tablesFound,
  };
}

/**
 * Check if a file has tables (for UI feedback)
 */
export async function hasTables(file: File): Promise<boolean> {
  try {
    const { xml } = await extractDocumentXml(file);
    return countTables(xml) > 0;
  } catch {
    return false;
  }
}
