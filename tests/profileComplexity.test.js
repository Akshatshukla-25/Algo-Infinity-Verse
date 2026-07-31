import fs from 'fs';
import path from 'path';

describe('Profile Complexity Feature Validation', () => {
  const codePlaygroundHtmlPath = path.join(process.cwd(), 'code-playground.html');
  const playgroundHtmlPath = path.join(process.cwd(), 'Playground/playground.html');
  const playgroundJsPath = path.join(process.cwd(), 'Playground/playground.js');

  test('code-playground.html includes Chart.js, Profile Complexity button, and profiler modal', () => {
    const html = fs.readFileSync(codePlaygroundHtmlPath, 'utf8');

    // Chart.js CDN
    expect(html).toContain('chart.js');

    // Profile Complexity button
    expect(html).toContain('id="profileBtn"');
    expect(html).toContain('Profile Complexity');

    // Profiler Modal & Canvas
    expect(html).toContain('id="profilerModal"');
    expect(html).toContain('id="profilerChart"');
    expect(html).toContain('id="profComplexity"');

    // JavaScript logic
    expect(html).toContain('runProfiler');
    expect(html).toContain('drawProfilerChart');
    expect(html).toContain('estimateComplexity');
    expect(html).toContain('10, 100, 1000, 5000');
  });

  test('Playground/playground.html includes Chart.js, Profile Complexity button, and profiler modal', () => {
    const html = fs.readFileSync(playgroundHtmlPath, 'utf8');

    // Chart.js CDN
    expect(html).toContain('chart.js');

    // Profile Complexity button
    expect(html).toContain('id="profileBtn"');
    expect(html).toContain('Profile Complexity');

    // Profiler Modal & Canvas
    expect(html).toContain('id="profilerModal"');
    expect(html).toContain('id="profilerChart"');
    expect(html).toContain('id="profComplexity"');
  });

  test('Playground/playground.js includes runProfiler and drawProfilerChart logic', () => {
    const js = fs.readFileSync(playgroundJsPath, 'utf8');

    expect(js).toContain('runProfiler');
    expect(js).toContain('drawProfilerChart');
    expect(js).toContain('estimateComplexity');

    // Dataset sizes N = [10, 100, 1000, 5000]
    expect(js).toContain('[10, 100, 1000, 5000]');

    // Standard reference curves
    expect(js).toContain('O(1)');
    expect(js).toContain('O(log N)');
    expect(js).toContain('O(N)');
    expect(js).toContain('O(N log N)');
    expect(js).toContain('O(N²)');
  });
});
