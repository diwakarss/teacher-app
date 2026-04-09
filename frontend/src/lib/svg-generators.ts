// ---------------------------------------------------------------------------
// SVG Generators — pure functions for educational charts
// ---------------------------------------------------------------------------
// Each generator takes a config object and returns an SVG string.
// No DOM, no side effects, easy to test.
// ---------------------------------------------------------------------------

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface PictogramConfig {
  title: string;
  key: string;          // e.g. "1 icon = 2 students"
  data: { label: string; value: number }[];
  iconShape?: 'circle' | 'star' | 'square';
}

export interface BarChartConfig {
  title: string;
  xLabel: string;
  yLabel: string;
  data: { label: string; value: number }[];
  orientation?: 'vertical' | 'horizontal';
}

export interface NumberLineConfig {
  min: number;
  max: number;
  step: number;
  markers?: number[];
  arrows?: { from: number; to: number; label?: string }[];
}

export interface TallyChartConfig {
  title: string;
  data: { label: string; tally: number }[];
}

// ── Colors ──────────────────────────────────────────────────────────────────

const PASTEL_COLORS = ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#c4b5fd', '#fbcfe8'];

// ── Icon shapes ─────────────────────────────────────────────────────────────

function iconSvg(shape: string, x: number, y: number, size: number, color: string): string {
  const r = size / 2;
  switch (shape) {
    case 'star': {
      const cx = x + r;
      const cy = y + r;
      const outer = r;
      const inner = r * 0.4;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
        const innerAngle = outerAngle + Math.PI / 5;
        points.push(`${cx + outer * Math.cos(outerAngle)},${cy - outer * Math.sin(outerAngle)}`);
        points.push(`${cx + inner * Math.cos(innerAngle)},${cy - inner * Math.sin(innerAngle)}`);
      }
      return `<polygon points="${points.join(' ')}" fill="${color}" stroke="#333" stroke-width="0.5"/>`;
    }
    case 'square':
      return `<rect x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}" rx="2" fill="${color}" stroke="#333" stroke-width="0.5"/>`;
    default: // circle
      return `<circle cx="${x + r}" cy="${y + r}" r="${r - 1}" fill="${color}" stroke="#333" stroke-width="0.5"/>`;
  }
}

// ── Pictogram ───────────────────────────────────────────────────────────────

export function generatePictogram(config: PictogramConfig): string {
  const shape = config.iconShape || 'circle';
  const keyValue = parseKeyValue(config.key);
  const iconSize = 20;
  const iconGap = 4;
  const labelWidth = 100;
  const rowHeight = iconSize + 8;
  const maxIcons = Math.max(...config.data.map((d) => Math.ceil(d.value / keyValue)));
  const width = labelWidth + maxIcons * (iconSize + iconGap) + 40;
  const height = 50 + config.data.length * rowHeight + 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`;
  svg += `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${escapeXml(config.title)}</text>`;

  config.data.forEach((item, rowIdx) => {
    const y = 40 + rowIdx * rowHeight;
    const color = PASTEL_COLORS[rowIdx % PASTEL_COLORS.length];
    svg += `<text x="${labelWidth - 8}" y="${y + iconSize / 2 + 5}" text-anchor="end" font-size="11" fill="#333">${escapeXml(item.label)}</text>`;

    const iconCount = Math.ceil(item.value / keyValue);
    for (let i = 0; i < iconCount; i++) {
      const x = labelWidth + i * (iconSize + iconGap);
      // Half icon for remainder
      if (i === iconCount - 1 && item.value % keyValue !== 0) {
        svg += `<g clip-path="url(#half-${rowIdx})">`;
        svg += `<clipPath id="half-${rowIdx}"><rect x="${x}" y="${y}" width="${iconSize / 2}" height="${iconSize}"/></clipPath>`;
        svg += iconSvg(shape, x, y, iconSize, color);
        svg += `</g>`;
      } else {
        svg += iconSvg(shape, x, y, iconSize, color);
      }
    }
  });

  // Key
  const keyY = height - 15;
  svg += `<text x="${width / 2}" y="${keyY}" text-anchor="middle" font-size="10" fill="#666">Key: ${escapeXml(config.key)}</text>`;
  svg += `</svg>`;
  return svg;
}

function parseKeyValue(key: string): number {
  const match = key.match(/(\d+)\s*(?:icon|symbol|picture)s?\s*=\s*(\d+)/i);
  if (match) return parseInt(match[2], 10) / parseInt(match[1], 10);
  const numMatch = key.match(/=\s*(\d+)/);
  return numMatch ? parseInt(numMatch[1], 10) : 1;
}

// ── Bar Chart ───────────────────────────────────────────────────────────────

export function generateBarChart(config: BarChartConfig): string {
  const orientation = config.orientation || 'vertical';
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = 360;
  const chartHeight = 240;
  const width = chartWidth + margin.left + margin.right;
  const height = chartHeight + margin.top + margin.bottom;
  const maxValue = Math.max(...config.data.map((d) => d.value));
  const niceMax = Math.ceil(maxValue / 5) * 5;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`;
  svg += `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${escapeXml(config.title)}</text>`;

  if (orientation === 'vertical') {
    const barWidth = Math.min(40, (chartWidth - 20) / config.data.length - 8);
    const barGap = (chartWidth - config.data.length * barWidth) / (config.data.length + 1);

    // Y-axis gridlines
    for (let i = 0; i <= 5; i++) {
      const val = (niceMax / 5) * i;
      const y = margin.top + chartHeight - (val / niceMax) * chartHeight;
      svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#e5e5e5" stroke-width="0.5"/>`;
      svg += `<text x="${margin.left - 8}" y="${y + 4}" text-anchor="end" font-size="9" fill="#666">${val}</text>`;
    }

    // Axes
    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1.5"/>`;

    // Bars
    config.data.forEach((item, i) => {
      const x = margin.left + barGap + i * (barWidth + barGap);
      const barHeight = (item.value / niceMax) * chartHeight;
      const y = margin.top + chartHeight - barHeight;
      const color = PASTEL_COLORS[i % PASTEL_COLORS.length];
      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="#333" stroke-width="0.5" rx="1"/>`;
      svg += `<text x="${x + barWidth / 2}" y="${margin.top + chartHeight + 14}" text-anchor="middle" font-size="9" fill="#333">${escapeXml(item.label)}</text>`;
      svg += `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" font-size="8" fill="#333">${item.value}</text>`;
    });

    // Axis labels
    svg += `<text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#555">${escapeXml(config.xLabel)}</text>`;
    svg += `<text x="14" y="${margin.top + chartHeight / 2}" text-anchor="middle" font-size="10" fill="#555" transform="rotate(-90, 14, ${margin.top + chartHeight / 2})">${escapeXml(config.yLabel)}</text>`;
  } else {
    // Horizontal bars
    const barHeight = Math.min(30, (chartHeight - 20) / config.data.length - 6);
    const barGap = (chartHeight - config.data.length * barHeight) / (config.data.length + 1);

    // X-axis gridlines
    for (let i = 0; i <= 5; i++) {
      const val = (niceMax / 5) * i;
      const x = margin.left + (val / niceMax) * chartWidth;
      svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartHeight}" stroke="#e5e5e5" stroke-width="0.5"/>`;
      svg += `<text x="${x}" y="${margin.top + chartHeight + 14}" text-anchor="middle" font-size="9" fill="#666">${val}</text>`;
    }

    // Axes
    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1.5"/>`;

    config.data.forEach((item, i) => {
      const y = margin.top + barGap + i * (barHeight + barGap);
      const bw = (item.value / niceMax) * chartWidth;
      const color = PASTEL_COLORS[i % PASTEL_COLORS.length];
      svg += `<rect x="${margin.left}" y="${y}" width="${bw}" height="${barHeight}" fill="${color}" stroke="#333" stroke-width="0.5" rx="1"/>`;
      svg += `<text x="${margin.left - 8}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="9" fill="#333">${escapeXml(item.label)}</text>`;
      svg += `<text x="${margin.left + bw + 4}" y="${y + barHeight / 2 + 4}" font-size="8" fill="#333">${item.value}</text>`;
    });
  }

  svg += `</svg>`;
  return svg;
}

// ── Number Line ─────────────────────────────────────────────────────────────

export function generateNumberLine(config: NumberLineConfig): string {
  const width = 500;
  const height = 100;
  const lineY = 50;
  const margin = 40;
  const lineWidth = width - margin * 2;
  const range = config.max - config.min;

  function xPos(val: number): number {
    return margin + ((val - config.min) / range) * lineWidth;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`;

  // Main line
  svg += `<line x1="${margin - 10}" y1="${lineY}" x2="${width - margin + 10}" y2="${lineY}" stroke="#333" stroke-width="2"/>`;
  // Arrowheads
  svg += `<polygon points="${width - margin + 10},${lineY} ${width - margin + 2},${lineY - 4} ${width - margin + 2},${lineY + 4}" fill="#333"/>`;

  // Tick marks
  for (let val = config.min; val <= config.max; val += config.step) {
    const x = xPos(val);
    const isMajor = val % (config.step * 5) === 0 || val === config.min || val === config.max;
    const tickHeight = isMajor ? 12 : 6;
    svg += `<line x1="${x}" y1="${lineY - tickHeight}" x2="${x}" y2="${lineY + tickHeight}" stroke="#333" stroke-width="${isMajor ? 1.5 : 0.8}"/>`;
    if (isMajor || config.step >= 5) {
      svg += `<text x="${x}" y="${lineY + tickHeight + 14}" text-anchor="middle" font-size="10" fill="#333">${val}</text>`;
    }
  }

  // Markers
  if (config.markers) {
    for (const m of config.markers) {
      if (m >= config.min && m <= config.max) {
        const x = xPos(m);
        svg += `<circle cx="${x}" cy="${lineY - 16}" r="5" fill="#ef4444" stroke="#333" stroke-width="0.5"/>`;
        svg += `<text x="${x}" y="${lineY - 26}" text-anchor="middle" font-size="9" fill="#ef4444" font-weight="bold">${m}</text>`;
      }
    }
  }

  // Jump arrows
  if (config.arrows) {
    for (const arrow of config.arrows) {
      const x1 = xPos(arrow.from);
      const x2 = xPos(arrow.to);
      const midX = (x1 + x2) / 2;
      const arcHeight = Math.min(25, Math.abs(x2 - x1) * 0.3);
      svg += `<path d="M ${x1} ${lineY - 14} Q ${midX} ${lineY - 14 - arcHeight} ${x2} ${lineY - 14}" fill="none" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrowhead)"/>`;
      if (arrow.label) {
        svg += `<text x="${midX}" y="${lineY - 14 - arcHeight - 4}" text-anchor="middle" font-size="8" fill="#3b82f6">${escapeXml(arrow.label)}</text>`;
      }
    }
    svg += `<defs><marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0,0 6,2 0,4" fill="#3b82f6"/></marker></defs>`;
  }

  svg += `</svg>`;
  return svg;
}

// ── Tally Chart ─────────────────────────────────────────────────────────────

export function generateTallyChart(config: TallyChartConfig): string {
  const rowHeight = 32;
  const colWidths = [120, 200, 60];
  const width = colWidths.reduce((a, b) => a + b, 0) + 20;
  const headerHeight = 30;
  const height = 40 + headerHeight + config.data.length * rowHeight + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`;
  svg += `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${escapeXml(config.title)}</text>`;

  const tableY = 35;
  const x0 = 10;

  // Header
  svg += `<rect x="${x0}" y="${tableY}" width="${width - 20}" height="${headerHeight}" fill="#f3f4f6" stroke="#333" stroke-width="1"/>`;
  const headers = ['Item', 'Tally', 'Total'];
  let hx = x0;
  headers.forEach((h, i) => {
    if (i > 0) svg += `<line x1="${hx}" y1="${tableY}" x2="${hx}" y2="${tableY + headerHeight + config.data.length * rowHeight}" stroke="#333" stroke-width="0.5"/>`;
    svg += `<text x="${hx + colWidths[i] / 2}" y="${tableY + headerHeight / 2 + 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${h}</text>`;
    hx += colWidths[i];
  });

  // Rows
  config.data.forEach((item, rowIdx) => {
    const ry = tableY + headerHeight + rowIdx * rowHeight;
    svg += `<rect x="${x0}" y="${ry}" width="${width - 20}" height="${rowHeight}" fill="${rowIdx % 2 === 0 ? '#fff' : '#fafafa'}" stroke="#333" stroke-width="0.5"/>`;

    // Label
    svg += `<text x="${x0 + 10}" y="${ry + rowHeight / 2 + 5}" font-size="10" fill="#333">${escapeXml(item.label)}</text>`;

    // Tally marks
    const tallyX = x0 + colWidths[0] + 10;
    const tallyY = ry + rowHeight / 2;
    svg += renderTallyMarks(item.tally, tallyX, tallyY);

    // Total
    svg += `<text x="${x0 + colWidths[0] + colWidths[1] + colWidths[2] / 2}" y="${ry + rowHeight / 2 + 5}" text-anchor="middle" font-size="10" fill="#333">${item.tally}</text>`;
  });

  // Outer border
  svg += `<rect x="${x0}" y="${tableY}" width="${width - 20}" height="${headerHeight + config.data.length * rowHeight}" fill="none" stroke="#333" stroke-width="1.5"/>`;

  svg += `</svg>`;
  return svg;
}

function renderTallyMarks(count: number, startX: number, y: number): string {
  let svg = '';
  const groupWidth = 28;
  const markGap = 5;
  const fullGroups = Math.floor(count / 5);
  const remainder = count % 5;

  for (let g = 0; g < fullGroups; g++) {
    const gx = startX + g * groupWidth;
    // 4 vertical lines
    for (let i = 0; i < 4; i++) {
      const mx = gx + i * markGap;
      svg += `<line x1="${mx}" y1="${y - 8}" x2="${mx}" y2="${y + 8}" stroke="#333" stroke-width="1.5"/>`;
    }
    // Diagonal cross
    svg += `<line x1="${gx - 1}" y1="${y + 6}" x2="${gx + 3 * markGap + 1}" y2="${y - 6}" stroke="#333" stroke-width="1.5"/>`;
  }

  // Remaining marks
  const rx = startX + fullGroups * groupWidth;
  for (let i = 0; i < remainder; i++) {
    const mx = rx + i * markGap;
    svg += `<line x1="${mx}" y1="${y - 8}" x2="${mx}" y2="${y + 8}" stroke="#333" stroke-width="1.5"/>`;
  }

  return svg;
}

// ── Scratch Blocks ──────────────────────────────────────────────────────────

export interface ScratchBlock {
  type: 'event' | 'motion' | 'control' | 'looks' | 'sound' | 'sensing' | 'operator' | 'variable';
  text: string;
  shape: 'hat' | 'stack' | 'cap' | 'c_start' | 'c_end';
  children?: ScratchBlock[];  // For C-shaped blocks (repeat, forever)
}

export interface ScratchBlocksConfig {
  blocks: ScratchBlock[];
}

const SCRATCH_COLORS: Record<string, { fill: string; stroke: string }> = {
  event:    { fill: '#FFBF00', stroke: '#CC9900' },
  motion:   { fill: '#4C97FF', stroke: '#3373CC' },
  control:  { fill: '#FFAB19', stroke: '#CF8B17' },
  looks:    { fill: '#9966FF', stroke: '#774DCB' },
  sound:    { fill: '#CF63CF', stroke: '#A63FA6' },
  sensing:  { fill: '#5CB1D6', stroke: '#47899B' },
  operator: { fill: '#59C059', stroke: '#389438' },
  variable: { fill: '#FF8C1A', stroke: '#DB6E00' },
};

const BLOCK_WIDTH = 200;
const BLOCK_HEIGHT = 34;
const NOTCH_WIDTH = 16;
const NOTCH_HEIGHT = 4;
const C_INDENT = 16;
const C_INNER_PAD = 4;

function scratchBlockPath(x: number, y: number, w: number, h: number, shape: string): string {
  const nw = NOTCH_WIDTH;
  const nh = NOTCH_HEIGHT;
  const r = 4;

  if (shape === 'hat') {
    // Rounded top (hat block), notch at bottom
    return `M ${x} ${y + 16} C ${x} ${y}, ${x + w} ${y}, ${x + w} ${y + 16}
      L ${x + w} ${y + h - nh}
      L ${x + 60 + nw} ${y + h - nh} L ${x + 58 + nw} ${y + h} L ${x + 42} ${y + h} L ${x + 40} ${y + h - nh}
      L ${x} ${y + h - nh} Z`;
  }

  if (shape === 'cap') {
    // Flat bottom (stop block), notch at top
    return `M ${x} ${y + r}
      L ${x + 40} ${y + r} L ${x + 42} ${y + r + nh} L ${x + 58 + nw} ${y + r + nh} L ${x + 60 + nw} ${y + r}
      L ${x + w} ${y + r}
      L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  }

  if (shape === 'c_start') {
    // C-block opening: top with notch, right side, bottom arm with inner notch
    return `M ${x} ${y + r}
      L ${x + 40} ${y + r} L ${x + 42} ${y + r + nh} L ${x + 58 + nw} ${y + r + nh} L ${x + 60 + nw} ${y + r}
      L ${x + w} ${y + r}
      L ${x + w} ${y + h}
      L ${x + C_INDENT + 60 + nw} ${y + h} L ${x + C_INDENT + 58 + nw} ${y + h + nh} L ${x + C_INDENT + 42} ${y + h + nh} L ${x + C_INDENT + 40} ${y + h}
      L ${x + C_INDENT} ${y + h}
      L ${x + C_INDENT} ${y + h + C_INNER_PAD}
      L ${x} ${y + h + C_INNER_PAD} Z`;
  }

  // Default stack block: notch at top and bottom
  return `M ${x} ${y + r}
    L ${x + 40} ${y + r} L ${x + 42} ${y + r + nh} L ${x + 58 + nw} ${y + r + nh} L ${x + 60 + nw} ${y + r}
    L ${x + w} ${y + r}
    L ${x + w} ${y + h - nh}
    L ${x + 60 + nw} ${y + h - nh} L ${x + 58 + nw} ${y + h} L ${x + 42} ${y + h} L ${x + 40} ${y + h - nh}
    L ${x} ${y + h - nh} Z`;
}

export function generateScratchBlocks(config: ScratchBlocksConfig): string {
  // Calculate total height
  let totalHeight = 10;
  for (const block of config.blocks) {
    totalHeight += measureBlockHeight(block);
  }
  totalHeight += 10;

  const width = BLOCK_WIDTH + 40;
  const height = Math.max(totalHeight, 60);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`;

  let y = 10;
  for (const block of config.blocks) {
    y = renderBlock(svg = svg, block, 10, y);
  }

  svg += `</svg>`;
  return svg;
}

function measureBlockHeight(block: ScratchBlock): number {
  if (block.shape === 'c_start' && block.children) {
    let innerHeight = 0;
    for (const child of block.children) {
      innerHeight += measureBlockHeight(child);
    }
    innerHeight = Math.max(innerHeight, BLOCK_HEIGHT);
    return BLOCK_HEIGHT + innerHeight + C_INNER_PAD + BLOCK_HEIGHT / 2;
  }
  return BLOCK_HEIGHT + 2; // 2px gap between blocks
}

function renderBlock(svgRef: string, block: ScratchBlock, x: number, y: number): number {
  const colors = SCRATCH_COLORS[block.type] || SCRATCH_COLORS.motion;
  let svg = '';

  if (block.shape === 'c_start' && block.children) {
    // Render C-shaped block (repeat, forever)
    let innerHeight = 0;
    for (const child of block.children) {
      innerHeight += measureBlockHeight(child);
    }
    innerHeight = Math.max(innerHeight, BLOCK_HEIGHT);

    // Top bar
    svg += `<path d="${scratchBlockPath(x, y, BLOCK_WIDTH, BLOCK_HEIGHT, 'c_start')}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`;
    svg += `<text x="${x + 12}" y="${y + BLOCK_HEIGHT / 2 + 5}" font-size="11" font-family="sans-serif" fill="#fff" font-weight="bold">${escapeXml(block.text)}</text>`;

    // Render children inside the C
    let childY = y + BLOCK_HEIGHT + C_INNER_PAD;
    for (const child of block.children) {
      childY = renderBlockToString(child, x + C_INDENT, childY, (s) => { svg += s; });
    }

    // Bottom bar (closing C)
    const bottomY = y + BLOCK_HEIGHT + C_INNER_PAD + innerHeight;
    svg += `<path d="${scratchBlockPath(x, bottomY, BLOCK_WIDTH, BLOCK_HEIGHT / 2, 'stack')}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`;

    // Vertical left side of C
    svg += `<rect x="${x}" y="${y + BLOCK_HEIGHT}" width="${C_INDENT}" height="${innerHeight + C_INNER_PAD}" fill="${colors.fill}" stroke="none"/>`;
    svg += `<line x1="${x}" y1="${y + BLOCK_HEIGHT}" x2="${x}" y2="${bottomY + BLOCK_HEIGHT / 2}" stroke="${colors.stroke}" stroke-width="1.5"/>`;

    svgRef = svgRef; // unused but keeps the pattern
    // We need to append svg to the outer string — use a different approach
    return y; // This approach won't work cleanly. Let me use a builder pattern.
  }

  // Simple block
  svg += `<path d="${scratchBlockPath(x, y, BLOCK_WIDTH, BLOCK_HEIGHT, block.shape)}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`;
  svg += `<text x="${x + 12}" y="${y + BLOCK_HEIGHT / 2 + 5}" font-size="11" font-family="sans-serif" fill="#fff" font-weight="bold">${escapeXml(block.text)}</text>`;

  return y + BLOCK_HEIGHT + 2;
}

// Better approach: accumulate SVG parts in an array
function renderBlockToString(
  block: ScratchBlock,
  x: number,
  y: number,
  emit: (s: string) => void,
): number {
  const colors = SCRATCH_COLORS[block.type] || SCRATCH_COLORS.motion;

  if (block.shape === 'c_start' && block.children) {
    let innerHeight = 0;
    for (const child of block.children) {
      innerHeight += measureBlockHeight(child);
    }
    innerHeight = Math.max(innerHeight, BLOCK_HEIGHT);

    // Top bar of C
    emit(`<path d="${scratchBlockPath(x, y, BLOCK_WIDTH, BLOCK_HEIGHT, 'c_start')}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`);
    emit(`<text x="${x + 12}" y="${y + BLOCK_HEIGHT / 2 + 5}" font-size="11" font-family="sans-serif" fill="#fff" font-weight="bold">${escapeXml(block.text)}</text>`);

    // Children
    let childY = y + BLOCK_HEIGHT + C_INNER_PAD;
    for (const child of block.children) {
      childY = renderBlockToString(child, x + C_INDENT, childY, emit);
    }

    // Left side of C
    const bottomY = y + BLOCK_HEIGHT + C_INNER_PAD + innerHeight;
    emit(`<rect x="${x}" y="${y + BLOCK_HEIGHT}" width="${C_INDENT}" height="${innerHeight + C_INNER_PAD}" fill="${colors.fill}" stroke="none"/>`);
    emit(`<line x1="${x}" y1="${y + BLOCK_HEIGHT}" x2="${x}" y2="${bottomY + BLOCK_HEIGHT / 2}" stroke="${colors.stroke}" stroke-width="1.5"/>`);

    // Bottom bar
    emit(`<path d="${scratchBlockPath(x, bottomY, BLOCK_WIDTH, BLOCK_HEIGHT / 2, 'stack')}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`);

    return bottomY + BLOCK_HEIGHT / 2 + 2;
  }

  // Simple block
  emit(`<path d="${scratchBlockPath(x, y, BLOCK_WIDTH, BLOCK_HEIGHT, block.shape)}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`);
  emit(`<text x="${x + 12}" y="${y + BLOCK_HEIGHT / 2 + 5}" font-size="11" font-family="sans-serif" fill="#fff" font-weight="bold">${escapeXml(block.text)}</text>`);

  return y + BLOCK_HEIGHT + 2;
}

// Rewrite generateScratchBlocks using the emit pattern
export function generateScratchBlocksSvg(config: ScratchBlocksConfig): string {
  const parts: string[] = [];
  const emit = (s: string) => parts.push(s);

  let totalHeight = 10;
  for (const block of config.blocks) {
    totalHeight += measureBlockHeight(block);
  }
  totalHeight += 10;

  const width = BLOCK_WIDTH + 40;
  const height = Math.max(totalHeight, 60);

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`);
  // Light grey background like Scratch editor
  parts.push(`<rect width="${width}" height="${height}" fill="#f9f9f9" rx="4"/>`);

  let y = 10;
  for (const block of config.blocks) {
    y = renderBlockToString(block, 10, y, emit);
  }

  parts.push(`</svg>`);
  return parts.join('');
}

/**
 * Parse a text description of Scratch blocks into ScratchBlocksConfig.
 * Format: one block per line, indented lines are children of C-blocks.
 * Example:
 *   when green flag clicked
 *   repeat 4
 *     move 100 steps
 *     turn right 90 degrees
 *   end
 *   stop all
 */
export function parseScratchBlocksPrompt(prompt: string): ScratchBlocksConfig {
  const lines = prompt.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  const blocks: ScratchBlock[] = [];
  let i = 0;

  function parseLevel(indent: number): ScratchBlock[] {
    const result: ScratchBlock[] = [];
    while (i < lines.length) {
      const line = lines[i];
      const lineIndent = line.length - line.trimStart().length;
      const text = line.trim();

      if (lineIndent < indent) break;
      if (text.toLowerCase() === 'end') { i++; break; }

      i++;
      const block = textToBlock(text);

      if (block.shape === 'c_start') {
        block.children = parseLevel(lineIndent + 1);
      }

      result.push(block);
    }
    return result;
  }

  blocks.push(...parseLevel(0));
  return { blocks };
}

function textToBlock(text: string): ScratchBlock {
  const lower = text.toLowerCase();

  // Events
  if (lower.includes('when') && (lower.includes('flag') || lower.includes('clicked') || lower.includes('start'))) {
    return { type: 'event', text, shape: 'hat' };
  }
  if (lower.startsWith('when ')) {
    return { type: 'event', text, shape: 'hat' };
  }

  // Control - C-shaped
  if (lower.startsWith('repeat') || lower.startsWith('forever')) {
    return { type: 'control', text, shape: 'c_start' };
  }
  if (lower.startsWith('if ')) {
    return { type: 'control', text, shape: 'c_start' };
  }

  // Control - cap
  if (lower.startsWith('stop')) {
    return { type: 'control', text, shape: 'cap' };
  }

  // Control - stack
  if (lower.startsWith('wait')) {
    return { type: 'control', text, shape: 'stack' };
  }

  // Motion
  if (lower.includes('move') || lower.includes('turn') || lower.includes('glide') ||
      lower.includes('go to') || lower.includes('point') || lower.includes('position') ||
      lower.includes('steps') || lower.includes('degree')) {
    return { type: 'motion', text, shape: 'stack' };
  }

  // Looks
  if (lower.includes('say') || lower.includes('think') || lower.includes('show') ||
      lower.includes('hide') || lower.includes('size') || lower.includes('costume') ||
      lower.includes('backdrop') || lower.includes('effect')) {
    return { type: 'looks', text, shape: 'stack' };
  }

  // Sound
  if (lower.includes('play') || lower.includes('sound') || lower.includes('volume')) {
    return { type: 'sound', text, shape: 'stack' };
  }

  // Sensing
  if (lower.includes('ask') || lower.includes('touching') || lower.includes('distance') ||
      lower.includes('key pressed') || lower.includes('mouse')) {
    return { type: 'sensing', text, shape: 'stack' };
  }

  // Variable
  if (lower.includes('set') && lower.includes('to') || lower.includes('change') && lower.includes('by')) {
    return { type: 'variable', text, shape: 'stack' };
  }

  // Default to motion (most common in primary school)
  return { type: 'motion', text, shape: 'stack' };
}

// ── Grid/Path Diagram ───────────────────────────────────────────────────────

export interface GridPathConfig {
  rows: number;
  cols: number;
  path?: { row: number; col: number }[];     // colored cells forming the path
  start?: { row: number; col: number };       // Start label position
  end?: { row: number; col: number };         // Stop label position
  labels?: { row: number; col: number; text: string }[];
}

export function generateGridPath(config: GridPathConfig): string {
  const cellSize = 30;
  const margin = 40;
  const width = config.cols * cellSize + margin * 2;
  const height = config.rows * cellSize + margin * 2;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width:100%;height:auto">`);

  // Grid cells
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const x = margin + c * cellSize;
      const y = margin + r * cellSize;
      const isPath = config.path?.some((p) => p.row === r && p.col === c);
      parts.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${isPath ? '#93c5fd' : '#fff'}" stroke="#ccc" stroke-width="0.5"/>`);
    }
  }

  // Grid border
  parts.push(`<rect x="${margin}" y="${margin}" width="${config.cols * cellSize}" height="${config.rows * cellSize}" fill="none" stroke="#333" stroke-width="1.5"/>`);

  // Row/col numbers
  for (let r = 0; r < config.rows; r++) {
    parts.push(`<text x="${margin - 8}" y="${margin + r * cellSize + cellSize / 2 + 4}" text-anchor="end" font-size="9" fill="#999">${r + 1}</text>`);
  }
  for (let c = 0; c < config.cols; c++) {
    parts.push(`<text x="${margin + c * cellSize + cellSize / 2}" y="${margin - 6}" text-anchor="middle" font-size="9" fill="#999">${c + 1}</text>`);
  }

  // Start label
  if (config.start) {
    const sx = margin + config.start.col * cellSize + cellSize / 2;
    const sy = margin + config.start.row * cellSize + cellSize / 2;
    parts.push(`<rect x="${sx - 20}" y="${sy - 10}" width="40" height="20" rx="3" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>`);
    parts.push(`<text x="${sx}" y="${sy + 4}" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">Start</text>`);
  }

  // End label
  if (config.end) {
    const ex = margin + config.end.col * cellSize + cellSize / 2;
    const ey = margin + config.end.row * cellSize + cellSize / 2;
    parts.push(`<rect x="${ex - 20}" y="${ey - 10}" width="40" height="20" rx="3" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>`);
    parts.push(`<text x="${ex}" y="${ey + 4}" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">Stop</text>`);
  }

  // Custom labels
  if (config.labels) {
    for (const label of config.labels) {
      const lx = margin + label.col * cellSize + cellSize / 2;
      const ly = margin + label.row * cellSize + cellSize / 2;
      parts.push(`<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="9" fill="#333">${escapeXml(label.text)}</text>`);
    }
  }

  parts.push(`</svg>`);
  return parts.join('');
}

export function parseGridPathPrompt(prompt: string): GridPathConfig {
  const fields = parsePromptFields(prompt);
  const rows = parseInt(fields.rows || '6', 10);
  const cols = parseInt(fields.cols || '6', 10);

  let path: { row: number; col: number }[] | undefined;
  if (fields.path) {
    path = fields.path.split(',').map((p) => {
      const [r, c] = p.trim().split(':').map(Number);
      return { row: (r || 1) - 1, col: (c || 1) - 1 };
    });
  }

  let start: { row: number; col: number } | undefined;
  if (fields.start) {
    const [r, c] = fields.start.split(':').map(Number);
    start = { row: (r || 1) - 1, col: (c || 1) - 1 };
  }

  let end: { row: number; col: number } | undefined;
  if (fields.end) {
    const [r, c] = fields.end.split(':').map(Number);
    end = { row: (r || 1) - 1, col: (c || 1) - 1 };
  }

  return { rows, cols, path, start, end };
}

// ── Prompt parser ───────────────────────────────────────────────────────────

/**
 * Parse a semicolon-separated prompt string from Sonnet into config,
 * then call the appropriate generator.
 */
export function generateSvgFromPrompt(
  kind: 'pictogram' | 'bar_chart' | 'number_line' | 'tally_chart' | 'scratch_blocks' | 'grid_path',
  prompt: string,
): string {
  const fields = parsePromptFields(prompt);

  switch (kind) {
    case 'pictogram':
      return generatePictogram({
        title: fields.title || 'Pictogram',
        key: fields.key || '1 icon = 1',
        data: parseDataPairs(fields.data || ''),
        iconShape: (fields.iconShape || 'circle') as 'circle' | 'star' | 'square',
      });

    case 'bar_chart':
      return generateBarChart({
        title: fields.title || 'Bar Chart',
        xLabel: fields.xLabel || fields.xlabel || '',
        yLabel: fields.yLabel || fields.ylabel || '',
        data: parseDataPairs(fields.data || ''),
        orientation: fields.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      });

    case 'number_line': {
      const markers = fields.markers
        ? fields.markers.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n))
        : undefined;
      return generateNumberLine({
        min: parseFloat(fields.min || '0'),
        max: parseFloat(fields.max || '10'),
        step: parseFloat(fields.step || '1'),
        markers,
      });
    }

    case 'tally_chart':
      return generateTallyChart({
        title: fields.title || 'Tally Chart',
        data: parseDataPairs(fields.data || '').map((d) => ({ label: d.label, tally: d.value })),
      });

    case 'scratch_blocks':
      return generateScratchBlocksSvg(parseScratchBlocksPrompt(prompt));

    case 'grid_path':
      return generateGridPath(parseGridPathPrompt(prompt));
  }
}

function parsePromptFields(prompt: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const parts = prompt.split(';');
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const key = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();
      fields[key] = value;
    }
  }
  return fields;
}

function parseDataPairs(data: string): { label: string; value: number }[] {
  return data.split(',').map((pair) => {
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      return {
        label: pair.slice(0, eqIdx).trim(),
        value: parseFloat(pair.slice(eqIdx + 1).trim()) || 0,
      };
    }
    return { label: pair.trim(), value: 0 };
  }).filter((d) => d.label);
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
