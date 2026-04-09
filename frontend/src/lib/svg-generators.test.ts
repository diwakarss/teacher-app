import { describe, it, expect } from 'vitest';
import {
  generatePictogram,
  generateBarChart,
  generateNumberLine,
  generateTallyChart,
  generateScratchBlocksSvg,
  parseScratchBlocksPrompt,
  generateGridPath,
  generateSvgFromPrompt,
} from './svg-generators';

describe('generatePictogram', () => {
  it('returns valid SVG with title and data', () => {
    const svg = generatePictogram({
      title: 'Favourite Fruits',
      key: '1 icon = 2 students',
      data: [
        { label: 'Apple', value: 6 },
        { label: 'Banana', value: 4 },
      ],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Favourite Fruits');
    expect(svg).toContain('Apple');
    expect(svg).toContain('Banana');
    expect(svg).toContain('1 icon = 2 students');
  });

  it('renders correct number of icons based on key', () => {
    const svg = generatePictogram({
      title: 'Test',
      key: '1 icon = 2',
      data: [{ label: 'A', value: 6 }],
    });
    // 6 / 2 = 3 circles
    const circles = (svg.match(/<circle/g) || []).length;
    expect(circles).toBe(3);
  });

  it('supports star and square shapes', () => {
    const star = generatePictogram({
      title: 'Test',
      key: '1 icon = 1',
      data: [{ label: 'A', value: 2 }],
      iconShape: 'star',
    });
    expect(star).toContain('<polygon');

    const square = generatePictogram({
      title: 'Test',
      key: '1 icon = 1',
      data: [{ label: 'A', value: 2 }],
      iconShape: 'square',
    });
    expect(square).toContain('<rect');
  });
});

describe('generateBarChart', () => {
  it('returns valid SVG with bars', () => {
    const svg = generateBarChart({
      title: 'Monthly Sales',
      xLabel: 'Month',
      yLabel: 'Sales',
      data: [
        { label: 'Jan', value: 10 },
        { label: 'Feb', value: 20 },
        { label: 'Mar', value: 15 },
      ],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Monthly Sales');
    expect(svg).toContain('Jan');
    expect(svg).toContain('Feb');
    expect(svg).toContain('Mar');
  });

  it('includes axis labels', () => {
    const svg = generateBarChart({
      title: 'Test',
      xLabel: 'Category',
      yLabel: 'Count',
      data: [{ label: 'A', value: 5 }],
    });
    expect(svg).toContain('Category');
    expect(svg).toContain('Count');
  });

  it('supports horizontal orientation', () => {
    const svg = generateBarChart({
      title: 'Test',
      xLabel: 'X',
      yLabel: 'Y',
      data: [{ label: 'A', value: 10 }],
      orientation: 'horizontal',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('A');
  });
});

describe('generateNumberLine', () => {
  it('returns valid SVG with tick marks', () => {
    const svg = generateNumberLine({ min: 0, max: 10, step: 1 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('0');
    expect(svg).toContain('10');
  });

  it('renders markers as dots', () => {
    const svg = generateNumberLine({
      min: 0,
      max: 20,
      step: 2,
      markers: [4, 8, 14],
    });
    const circles = (svg.match(/<circle/g) || []).length;
    expect(circles).toBe(3);
  });

  it('renders jump arrows', () => {
    const svg = generateNumberLine({
      min: 0,
      max: 10,
      step: 1,
      arrows: [{ from: 2, to: 5, label: '+3' }],
    });
    expect(svg).toContain('<path');
    expect(svg).toContain('+3');
  });
});

describe('generateTallyChart', () => {
  it('returns valid SVG with tally marks', () => {
    const svg = generateTallyChart({
      title: 'Favourite Colors',
      data: [
        { label: 'Red', tally: 7 },
        { label: 'Blue', tally: 12 },
      ],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Favourite Colors');
    expect(svg).toContain('Red');
    expect(svg).toContain('Blue');
    expect(svg).toContain('7');
    expect(svg).toContain('12');
  });
});

describe('generateSvgFromPrompt', () => {
  it('parses pictogram prompt', () => {
    const svg = generateSvgFromPrompt(
      'pictogram',
      'title: Favourite Fruits; key: 1 icon = 2 students; data: Apple=6, Banana=8',
    );
    expect(svg).toContain('Favourite Fruits');
    expect(svg).toContain('Apple');
    expect(svg).toContain('Banana');
  });

  it('parses bar chart prompt', () => {
    const svg = generateSvgFromPrompt(
      'bar_chart',
      'title: Rainfall; xLabel: Month; yLabel: mm; data: Jan=30, Feb=20',
    );
    expect(svg).toContain('Rainfall');
    expect(svg).toContain('Jan');
  });

  it('parses number line prompt', () => {
    const svg = generateSvgFromPrompt(
      'number_line',
      'min: 0; max: 20; step: 2; markers: 4, 8, 14',
    );
    expect(svg).toContain('<svg');
    const circles = (svg.match(/<circle/g) || []).length;
    expect(circles).toBe(3);
  });

  it('parses tally chart prompt', () => {
    const svg = generateSvgFromPrompt(
      'tally_chart',
      'title: Survey; data: Red=7, Blue=12, Green=3',
    );
    expect(svg).toContain('Survey');
    expect(svg).toContain('Red');
  });

  it('handles missing fields gracefully', () => {
    const svg = generateSvgFromPrompt('pictogram', 'data: A=3, B=5');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Pictogram'); // default title
  });

  it('parses scratch blocks prompt', () => {
    const svg = generateSvgFromPrompt(
      'scratch_blocks',
      'when green flag clicked\nmove 100 steps\nturn right 90 degrees',
    );
    expect(svg).toContain('<svg');
    expect(svg).toContain('when green flag clicked');
    expect(svg).toContain('move 100 steps');
  });

  it('parses grid path prompt', () => {
    const svg = generateSvgFromPrompt(
      'grid_path',
      'rows: 4; cols: 4; start: 1:1; end: 4:4; path: 1:1, 1:2, 2:2, 3:2, 3:3, 4:3, 4:4',
    );
    expect(svg).toContain('<svg');
    expect(svg).toContain('Start');
    expect(svg).toContain('Stop');
  });
});

describe('generateScratchBlocksSvg', () => {
  it('renders simple block sequence', () => {
    const config = parseScratchBlocksPrompt(
      'when green flag clicked\nmove 100 steps\nturn right 90 degrees\nstop all',
    );
    const svg = generateScratchBlocksSvg(config);
    expect(svg).toContain('<svg');
    expect(svg).toContain('when green flag clicked');
    expect(svg).toContain('move 100 steps');
    expect(svg).toContain('stop all');
  });

  it('renders C-shaped repeat block with children', () => {
    const config = parseScratchBlocksPrompt(
      'when green flag clicked\nrepeat 4\n  move 100 steps\n  turn right 90 degrees\nend',
    );
    expect(config.blocks).toHaveLength(2); // hat + repeat
    expect(config.blocks[1].children).toHaveLength(2);
    const svg = generateScratchBlocksSvg(config);
    expect(svg).toContain('repeat 4');
    expect(svg).toContain('move 100 steps');
  });

  it('detects block types correctly', () => {
    const config = parseScratchBlocksPrompt(
      'when green flag clicked\nmove 10 steps\nsay Hello\nwait 1 seconds\nstop all',
    );
    expect(config.blocks[0].type).toBe('event');
    expect(config.blocks[0].shape).toBe('hat');
    expect(config.blocks[1].type).toBe('motion');
    expect(config.blocks[2].type).toBe('looks');
    expect(config.blocks[3].type).toBe('control');
    expect(config.blocks[4].type).toBe('control');
    expect(config.blocks[4].shape).toBe('cap');
  });
});

describe('generateGridPath', () => {
  it('renders a grid with path cells', () => {
    const svg = generateGridPath({
      rows: 4,
      cols: 4,
      path: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }],
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Start');
    expect(svg).toContain('Stop');
    // Path cells should be colored
    expect(svg).toContain('#93c5fd');
  });

  it('renders empty grid without path', () => {
    const svg = generateGridPath({ rows: 3, cols: 3 });
    expect(svg).toContain('<svg');
    // All cells white
    expect(svg).not.toContain('#93c5fd');
  });
});
