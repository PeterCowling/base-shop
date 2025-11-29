import 'cypress-axe';

type TokenMap = Record<string, string>;

function applyTokens(win: Window, tokens: TokenMap) {
  const root = win.document.documentElement as HTMLElement;
  Object.entries(tokens).forEach(([k, v]) => {
    if (k.startsWith('--color')) root.style.setProperty(k, v);
  });
}

function mountSamples(win: Window, tokens: TokenMap) {
  const doc = win.document;
  const container = doc.createElement('section');
  container.id = 'contrast-samples';
  const PAIRS: Array<[string, string]> = [
    ['--color-bg', '--color-fg'],
    ['--color-primary', '--color-primary-fg'],
    ['--color-accent', '--color-accent-fg'],
    ['--color-danger', '--color-danger-fg'],
    ['--color-success', '--color-success-fg'],
    ['--color-warning', '--color-warning-fg'],
    ['--color-info', '--color-info-fg'],
  ];
  PAIRS.forEach(([bgKey, fgKey]) => {
    if (!tokens[bgKey] || !tokens[fgKey]) return; // only test present pairs
    const tile = doc.createElement('div');
    tile.setAttribute('data-pair', `${bgKey}__${fgKey}`);
    tile.style.background = `hsl(var(${bgKey}))`;
    tile.style.color = `hsl(var(${fgKey}))`;
    tile.style.padding = '10px';
    tile.style.margin = '4px 0';
    tile.innerText = `${bgKey} vs ${fgKey}`;
    container.appendChild(tile);
  });
  doc.body.appendChild(container);
}

describe('Editors color contrast across themes', () => {
  const themes: Array<{ name: string; loader: () => Promise<{ tokens: TokenMap }> }> = [
    { name: 'dark', loader: () => import('../../../../packages/themes/dark/src/tailwind-tokens') },
    { name: 'bcd', loader: () => import('../../../../packages/themes/bcd/src/tailwind-tokens') },
    { name: 'brandx', loader: () => import('../../../../packages/themes/brandx/src/tailwind-tokens') },
  ];

  for (const theme of themes) {
    it(`has no color-contrast violations for ${theme.name} token pairs`, function () {
      cy.visit('about:blank').then(async (win) => {
        const { tokens } = await theme.loader();
        applyTokens(win, tokens);
        mountSamples(win, tokens);
      });

      cy.window().then((win) => {
        const axe = (win as any).axe;
        if (!axe) {
          cy.log(
            `Skipping editors-contrast for theme ${theme.name}: axe-core is not available in this environment.`,
          );
           
          (this as any).skip();
          return;
        }
      });

      cy.injectAxe();
      // Only evaluate the sample tiles we rendered
      cy.checkA11y('#contrast-samples', { runOnly: ['color-contrast'] });
    });
  }
});
