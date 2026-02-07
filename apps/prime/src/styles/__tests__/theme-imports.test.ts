import fs from 'node:fs';
import path from 'node:path';

describe('Prime theme imports', () => {
  it('TC-01: global styles include base and prime token imports in correct order', () => {
    const filePath = path.join(__dirname, '..', 'globals.css');
    const css = fs.readFileSync(filePath, 'utf8');

    const baseIdx = css.indexOf("@import '@themes/base/tokens.css';");
    const primeIdx = css.indexOf("@import '@themes/prime/tokens.css';");

    expect(baseIdx).toBeGreaterThanOrEqual(0);
    expect(primeIdx).toBeGreaterThanOrEqual(0);
    expect(primeIdx).toBeGreaterThan(baseIdx);
  });

  it('TC-02: app-local token overrides are removed from global styles', () => {
    const filePath = path.join(__dirname, '..', 'globals.css');
    const css = fs.readFileSync(filePath, 'utf8');

    expect(css).not.toContain("--font-sans: 'Inter'");
    expect(css).not.toContain(':root {');
    expect(css).not.toContain('.theme-dark {');
  });
});
