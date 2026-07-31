import fs from 'fs';
import path from 'path';

describe('Groovy Editor File and Structure Validation', () => {
  const groovyHtmlPath = path.join(process.cwd(), 'pages/editors/groovy-editor/groovy-editor.html');
  const groovyJsPath = path.join(process.cwd(), 'pages/editors/groovy-editor/groovy-editor.js');
  const groovyCssPath = path.join(process.cwd(), 'pages/editors/groovy-editor/groovy-editor.css');
  const editorsJsPath = path.join(process.cwd(), 'pages/editors/editors.js');
  const playgroundHtmlPath = path.join(process.cwd(), 'Playground/playground.html');
  const playgroundJsPath = path.join(process.cwd(), 'Playground/playground.js');
  const codePlaygroundHtmlPath = path.join(process.cwd(), 'code-playground.html');

  test('Groovy Editor files exist', () => {
    expect(fs.existsSync(groovyHtmlPath)).toBe(true);
    expect(fs.existsSync(groovyJsPath)).toBe(true);
    expect(fs.existsSync(groovyCssPath)).toBe(true);
  });

  test('groovy-editor.html includes essential UI components', () => {
    const html = fs.readFileSync(groovyHtmlPath, 'utf8');
    expect(html).toContain('groovyActiveFileName');
    expect(html).toContain('groovyExampleSelect');
    expect(html).toContain('.groovy');
  });

  test('groovy-editor.js defines required examples and syntax highlighter', () => {
    const js = fs.readFileSync(groovyJsPath, 'utf8');
    expect(js).toContain('GROOVY_EXAMPLES');
    expect(js).toContain('hello');
    expect(js).toContain('closures');
    expect(js).toContain('gradle');
    expect(js).toContain('builders');
    expect(js).toContain('pogo');
    expect(js).toContain('highlightGroovy');
    expect(js).toContain('executeGroovy');
  });

  test('editors.js includes Groovy Editor registration', () => {
    const js = fs.readFileSync(editorsJsPath, 'utf8');
    expect(js).toContain('Groovy Editor');
    expect(js).toContain('/pages/editors/groovy-editor/groovy-editor.html');
  });

  test('Playground/playground.html and playground.js include groovy support', () => {
    const html = fs.readFileSync(playgroundHtmlPath, 'utf8');
    const js = fs.readFileSync(playgroundJsPath, 'utf8');
    expect(html).toContain('value="groovy"');
    expect(js).toContain('runGroovy');
    expect(js).toContain('ace/mode/groovy');
  });

  test('code-playground.html includes groovy support', () => {
    const html = fs.readFileSync(codePlaygroundHtmlPath, 'utf8');
    expect(html).toContain('value="groovy"');
    expect(html).toContain('groovy:');
  });
});
