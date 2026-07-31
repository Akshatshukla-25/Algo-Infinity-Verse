import fs from 'fs';
import path from 'path';

describe('Visual Basic .NET Editor File and Structure Validation', () => {
  const vbnetHtmlPath = path.join(process.cwd(), 'pages/editors/vbnet-editor/vbnet-editor.html');
  const vbnetJsPath = path.join(process.cwd(), 'pages/editors/vbnet-editor/vbnet-editor.js');
  const vbnetCssPath = path.join(process.cwd(), 'pages/editors/vbnet-editor/vbnet-editor.css');
  const editorsJsPath = path.join(process.cwd(), 'pages/editors/editors.js');
  const playgroundHtmlPath = path.join(process.cwd(), 'Playground/playground.html');
  const playgroundJsPath = path.join(process.cwd(), 'Playground/playground.js');
  const codePlaygroundHtmlPath = path.join(process.cwd(), 'code-playground.html');

  test('VB.NET Editor files exist', () => {
    expect(fs.existsSync(vbnetHtmlPath)).toBe(true);
    expect(fs.existsSync(vbnetJsPath)).toBe(true);
    expect(fs.existsSync(vbnetCssPath)).toBe(true);
  });

  test('vbnet-editor.html includes essential UI components', () => {
    const html = fs.readFileSync(vbnetHtmlPath, 'utf8');
    expect(html).toContain('vbnetActiveFileName');
    expect(html).toContain('vbnetExampleSelect');
    expect(html).toContain('.vb');
  });

  test('vbnet-editor.js defines required examples and syntax highlighter', () => {
    const js = fs.readFileSync(vbnetJsPath, 'utf8');
    expect(js).toContain('VBNET_EXAMPLES');
    expect(js).toContain('hello');
    expect(js).toContain('classes');
    expect(js).toContain('control');
    expect(js).toContain('methods');
    expect(js).toContain('oop');
    expect(js).toContain('highlightVbNet');
    expect(js).toContain('executeVbNet');
  });

  test('editors.js includes VB.NET Editor registration', () => {
    const js = fs.readFileSync(editorsJsPath, 'utf8');
    expect(js).toContain('VB.NET Editor');
    expect(js).toContain('/pages/editors/vbnet-editor/vbnet-editor.html');
  });

  test('Playground/playground.html and playground.js include vbnet support', () => {
    const html = fs.readFileSync(playgroundHtmlPath, 'utf8');
    const js = fs.readFileSync(playgroundJsPath, 'utf8');
    expect(html).toContain('value="vbnet"');
    expect(js).toContain('runVbNet');
    expect(js).toContain('ace/mode/vbscript');
  });

  test('code-playground.html includes vbnet support', () => {
    const html = fs.readFileSync(codePlaygroundHtmlPath, 'utf8');
    expect(html).toContain('value="vbnet"');
    expect(html).toContain('vbnet:');
  });
});
