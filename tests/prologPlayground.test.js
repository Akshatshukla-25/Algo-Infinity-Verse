import fs from 'fs';
import path from 'path';

describe('Prolog Playground File and Structure Validation', () => {
  const prologHtmlPath = path.join(
    process.cwd(),
    'pages/editors/prolog-playground/prolog-playground.html'
  );
  const prologJsPath = path.join(
    process.cwd(),
    'pages/editors/prolog-playground/prolog-playground.js'
  );
  const prologCssPath = path.join(
    process.cwd(),
    'pages/editors/prolog-playground/prolog-playground.css'
  );
  const editorsJsPath = path.join(process.cwd(), 'pages/editors/editors.js');
  const playgroundHtmlPath = path.join(process.cwd(), 'Playground/playground.html');
  const playgroundJsPath = path.join(process.cwd(), 'Playground/playground.js');
  const codePlaygroundHtmlPath = path.join(process.cwd(), 'code-playground.html');

  test('Prolog Playground files exist', () => {
    expect(fs.existsSync(prologHtmlPath)).toBe(true);
    expect(fs.existsSync(prologJsPath)).toBe(true);
    expect(fs.existsSync(prologCssPath)).toBe(true);
  });

  test('prolog-playground.html includes Tau Prolog CDN and query bar', () => {
    const html = fs.readFileSync(prologHtmlPath, 'utf8');
    expect(html).toContain('tau-prolog.js');
    expect(html).toContain('prologQueryInput');
    expect(html).toContain('prologExampleSelect');
    expect(html).toContain('.pl');
  });

  test('prolog-playground.js defines required examples and syntax highlighter', () => {
    const js = fs.readFileSync(prologJsPath, 'utf8');
    expect(js).toContain('PROLOG_EXAMPLES');
    expect(js).toContain('family');
    expect(js).toContain('listops');
    expect(js).toContain('math');
    expect(js).toContain('graph');
    expect(js).toContain('nqueens');
    expect(js).toContain('highlightProlog');
    expect(js).toContain('executeProlog');
  });

  test('editors.js includes Prolog Playground registration', () => {
    const js = fs.readFileSync(editorsJsPath, 'utf8');
    expect(js).toContain('Prolog Playground');
    expect(js).toContain('/pages/editors/prolog-playground/prolog-playground.html');
  });

  test('Playground/playground.html and playground.js include prolog support', () => {
    const html = fs.readFileSync(playgroundHtmlPath, 'utf8');
    const js = fs.readFileSync(playgroundJsPath, 'utf8');
    expect(html).toContain('value="prolog"');
    expect(js).toContain('runProlog');
    expect(js).toContain('ace/mode/prolog');
  });

  test('code-playground.html includes prolog support', () => {
    const html = fs.readFileSync(codePlaygroundHtmlPath, 'utf8');
    expect(html).toContain('value="prolog"');
    expect(html).toContain('prolog:');
  });
});
