import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const VALID_TEMPLATES = ["basic", "rich"] as const;
type Template = (typeof VALID_TEMPLATES)[number];

const VALID_PALETTES = ["operational", "architecture", "workflow", "analytics"] as const;
type Palette = (typeof VALID_PALETTES)[number];

type CliOptions = {
  inputPaths: string[];
  outDir?: string;
  template: Template;
  palette: Palette;
  paletteFile?: string;
};

function printUsage(): void {
  console.log(
    [
      "Render .user.md docs to standalone .user.html companions.",
      "",
      "Usage:",
      "  pnpm docs:render-user-html -- [options] <path/to/file.user.md> [more files...]",
      "",
      "Options:",
      "  --out-dir <dir>       Output directory (default: same as input)",
      "  --template basic|rich Template to use (default: basic)",
      "  --palette <name>      Color palette: operational, architecture, workflow, analytics (default: operational)",
      "  --palette-file <path> Custom palette CSS file (overrides --palette)",
      "",
      "Examples:",
      "  pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md",
      "  pnpm docs:render-user-html -- --template rich --palette workflow docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md",
    ].join("\n")
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { inputPaths: [], template: "basic", palette: "operational" };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--out-dir") {
      const dir = argv[i + 1];
      if (!dir) {
        throw new Error("--out-dir requires a directory value.");
      }
      options.outDir = dir;
      i += 1;
      continue;
    }

    if (arg === "--template") {
      const val = argv[i + 1] as Template | undefined;
      if (!val || !VALID_TEMPLATES.includes(val)) {
        throw new Error(`--template must be one of: ${VALID_TEMPLATES.join(", ")}`);
      }
      options.template = val;
      i += 1;
      continue;
    }

    if (arg === "--palette") {
      const val = argv[i + 1] as Palette | undefined;
      if (!val || !VALID_PALETTES.includes(val)) {
        throw new Error(`--palette must be one of: ${VALID_PALETTES.join(", ")}`);
      }
      options.palette = val;
      i += 1;
      continue;
    }

    if (arg === "--palette-file") {
      const filePath = argv[i + 1];
      if (!filePath) {
        throw new Error("--palette-file requires a file path.");
      }
      options.paletteFile = filePath;
      i += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.inputPaths.push(arg);
  }

  if (options.inputPaths.length === 0) {
    throw new Error("At least one markdown input path is required.");
  }

  return options;
}

function stripFrontMatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) return markdown;

  const closingFence = markdown.indexOf("\n---\n", 4);
  if (closingFence < 0) return markdown;

  return markdown.slice(closingFence + 5).replace(/^\n+/, "");
}

function extractTitle(markdownBody: string, sourcePath: string): string {
  const headingMatch = markdownBody.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  return path.basename(sourcePath).replace(/\.user\.md$/i, "").replace(/\.md$/i, "");
}

function decodeHtmlEntities(value: string): string {
  return value
    // Named entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Decimal numeric character references (e.g. &#39;)
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(Number(dec)))
    // Hex numeric character references (e.g. &#x3C; — how rehype-stringify encodes <)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function normalizeMermaidLabelLineBreaks(diagram: string): string {
  // Authors often use "\n" inside Mermaid labels; Mermaid renders "<br/>" reliably.
  return diagram.replace(/\\n/g, "<br/>");
}

function transformMermaidBlocks(html: string): string {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_whole, encoded) => {
      const decodedDiagram = decodeHtmlEntities(String(encoded)).trim();
      const diagram = normalizeMermaidLabelLineBreaks(decodedDiagram);
      return `<pre class="mermaid">${diagram}</pre>`;
    }
  );
}

function transformChartBlocks(html: string): string {
  return html.replace(
    /<pre><code class="language-chart">([\s\S]*?)<\/code><\/pre>/g,
    (_whole, encoded) => {
      const decoded = decodeHtmlEntities(String(encoded)).trim();
      return `<pre class="chart" style="display:none">${decoded}</pre>`;
    }
  );
}

function hasChartBlocks(html: string): boolean {
  return html.includes('<pre class="chart"');
}

/**
 * Wraps everything from the first <h2>Engineering appendix</h2> heading to the
 * end of the document in a <section data-audience="engineering"> block.
 *
 * This implements Fallback A for audience separation: no raw HTML is required
 * in the markdown source. Authors mark the boundary with a standard markdown
 * heading "## Engineering appendix" and the render pipeline injects the wrapper.
 *
 * TOC guard (2026-02-17): no auto-TOC is generated by this pipeline.
 * If a TOC is ever added, it MUST be built only from headings that appear
 * BEFORE the engineering appendix section — not from all h2/h3 headings.
 */
function wrapEngineeringAppendix(html: string): string {
  const markerRegex = /(<h2[^>]*>\s*Engineering appendix\s*<\/h2>)/i;
  const match = html.match(markerRegex);
  if (!match || match.index === undefined) return html;

  const before = html.slice(0, match.index);
  const from = html.slice(match.index);
  return `${before}<section data-audience="engineering">\n${from}\n</section>`;
}

function resolveOutputPath(inputPath: string, outDir?: string): string {
  const outputName = path
    .basename(inputPath)
    .replace(/\.user\.md$/i, ".user.html")
    .replace(/\.md$/i, ".html");

  if (outDir) {
    return path.join(outDir, outputName);
  }

  return inputPath.replace(/\.user\.md$/i, ".user.html").replace(/\.md$/i, ".html");
}

async function renderMarkdownToHtml(markdownBody: string): Promise<string> {
  const editorialRequire = createRequire(path.resolve(process.cwd(), "packages/editorial/package.json"));
  const { unified } = await import(pathToFileURL(editorialRequire.resolve("unified")).href);
  const remarkParse = (await import(pathToFileURL(editorialRequire.resolve("remark-parse")).href)).default;
  const remarkGfm = (await import(pathToFileURL(editorialRequire.resolve("remark-gfm")).href)).default;
  const remarkRehype = (await import(pathToFileURL(editorialRequire.resolve("remark-rehype")).href)).default;
  const rehypeStringify = (await import(pathToFileURL(editorialRequire.resolve("rehype-stringify")).href)).default;

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdownBody);

  return String(file);
}

const TEMPLATES_DIR = path.resolve("docs/templates/visual");

async function loadTemplate(name: Template): Promise<string | null> {
  const templatePath = path.join(TEMPLATES_DIR, `${name}-template.html`);
  try {
    return await fs.readFile(templatePath, "utf8");
  } catch {
    return null;
  }
}

const PALETTE_CSS: Record<Palette, string> = {
  operational: `:root {
  --bg:#f9f8f6;--surface:#ffffff;--border:#e4e2de;--border-soft:#eeece9;
  --text:#1a1918;--text-muted:#6b6762;--accent:#2d6a4f;--accent-soft:#e8f4ee;
  --warn:#92400e;--warn-soft:#fef3c7;--danger:#991b1b;--danger-soft:#fee2e2;
  --code-bg:#f3f1ee;--code-border:#dbd9d4;--radius:6px;--radius-lg:10px;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#1a1918;--surface:#242220;--border:#3d3a37;--border-soft:#2e2c2a;
  --text:#f5f3f0;--text-muted:#a39e98;--accent:#52b788;--accent-soft:#1e3d30;
  --warn:#fbbf24;--warn-soft:#27201a;--danger:#f87171;--danger-soft:#3b1515;
  --code-bg:#2e2c2a;--code-border:#3d3a37;
}}`,
  architecture: `:root {
  --bg:#faf8f5;--surface:#ffffff;--border:#e0dbd4;--border-soft:#ebe7e1;
  --text:#2d2822;--text-muted:#7a7168;--accent:#a0522d;--accent-soft:#f5ebe4;
  --warn:#b45309;--warn-soft:#fef3c7;--danger:#991b1b;--danger-soft:#fee2e2;
  --code-bg:#f0ece6;--code-border:#d9d3cb;--radius:6px;--radius-lg:10px;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#1e1b18;--surface:#28241f;--border:#42392e;--border-soft:#332e27;
  --text:#f2ede7;--text-muted:#a89d93;--accent:#cd7f5c;--accent-soft:#3d2518;
  --warn:#fbbf24;--warn-soft:#27201a;--danger:#f87171;--danger-soft:#3b1515;
  --code-bg:#332e27;--code-border:#42392e;
}}`,
  workflow: `:root {
  --bg:#f6fafa;--surface:#ffffff;--border:#d4e4e4;--border-soft:#e3eded;
  --text:#1a2626;--text-muted:#5f7474;--accent:#0d7377;--accent-soft:#e0f5f5;
  --warn:#92400e;--warn-soft:#fef3c7;--danger:#991b1b;--danger-soft:#fee2e2;
  --code-bg:#ecf4f4;--code-border:#c9dede;--radius:6px;--radius-lg:10px;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#141e1e;--surface:#1c2828;--border:#2e4242;--border-soft:#243434;
  --text:#e8f4f4;--text-muted:#8aadad;--accent:#2dd4bf;--accent-soft:#0d3333;
  --warn:#fbbf24;--warn-soft:#27201a;--danger:#f87171;--danger-soft:#3b1515;
  --code-bg:#243434;--code-border:#2e4242;
}}`,
  analytics: `:root {
  --bg:#fdf8f8;--surface:#ffffff;--border:#e8d8d8;--border-soft:#f0e4e4;
  --text:#2a1a1a;--text-muted:#7a6060;--accent:#9f1239;--accent-soft:#fce7f3;
  --warn:#92400e;--warn-soft:#fef3c7;--danger:#991b1b;--danger-soft:#fee2e2;
  --code-bg:#f5ecec;--code-border:#e0d0d0;--radius:6px;--radius-lg:10px;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#1e1418;--surface:#281c22;--border:#422e36;--border-soft:#33242c;
  --text:#f5ece8;--text-muted:#ad8e96;--accent:#fb7185;--accent-soft:#3d1225;
  --warn:#fbbf24;--warn-soft:#27201a;--danger:#f87171;--danger-soft:#3b1515;
  --code-bg:#33242c;--code-border:#422e36;
}}`,
};

function applyTemplate(
  template: string,
  params: { title: string; sourcePath: string; htmlBody: string; palette: Palette },
): string {
  const generatedAtIso = new Date().toISOString();
  const sourceRelative = path.relative(process.cwd(), params.sourcePath);
  return template
    .replace("{{TITLE}}", params.title)
    .replace("{{BODY}}", params.htmlBody)
    .replace("{{SOURCE}}", sourceRelative)
    .replace("{{GENERATED_AT}}", generatedAtIso)
    .replace("{{PALETTE_CSS}}", PALETTE_CSS[params.palette]);
}

const CHARTJS_LOADER = `<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<script>
  (function(){
    var style=getComputedStyle(document.documentElement);
    var textColor=style.getPropertyValue('--text').trim()||'#101418';
    var mutedColor=style.getPropertyValue('--muted').trim()||style.getPropertyValue('--text-muted').trim()||'#5a6570';
    var borderColor=style.getPropertyValue('--border').trim()||'#d9e0e7';
    Chart.defaults.color=mutedColor;
    Chart.defaults.borderColor=borderColor;
    Chart.defaults.plugins.legend.labels.color=textColor;
    Chart.defaults.plugins.title.color=textColor;
    Chart.defaults.scale.grid=Chart.defaults.scale.grid||{};
    Chart.defaults.scale.grid.color=borderColor;
    Chart.defaults.scale.ticks=Chart.defaults.scale.ticks||{};
    Chart.defaults.scale.ticks.color=mutedColor;
    function renderChartBlocks(){
      document.querySelectorAll('pre.chart').forEach(function(pre){
        try{
          var config=JSON.parse(pre.textContent);
          var container=document.createElement('div');
          container.style.position='relative';
          container.style.height=config.height||'300px';
          container.style.marginBottom='1.5rem';
          config.options=config.options||{};
          config.options.responsive=true;
          config.options.maintainAspectRatio=false;
          delete config.height;
          var canvas=document.createElement('canvas');
          container.appendChild(canvas);
          pre.replaceWith(container);
          new Chart(canvas,config);
        }catch(err){
          pre.style.display='block';pre.style.color='#991b1b';
          pre.style.background='#fee2e2';pre.style.padding='1rem';
          pre.style.borderRadius='6px';
          pre.textContent='Chart render error: '+err.message;
        }
      });
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',renderChartBlocks);}
    else{renderChartBlocks();}
  })();
</script>`;

function wrapHtmlDocument(params: {
  title: string;
  sourcePath: string;
  htmlBody: string;
}): string {
  const generatedAtIso = new Date().toISOString();
  const sourceRelative = path.relative(process.cwd(), params.sourcePath);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${params.title}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #101418;
      --muted: #5a6570;
      --border: #d9e0e7;
      --header: #f5f8fb;
      --link: #0b63ce;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    h1, h2, h3 {
      line-height: 1.25;
    }
    p, li {
      line-height: 1.5;
    }
    a {
      color: var(--link);
    }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    pre {
      background: #f7f9fb;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--header);
      font-weight: 700;
    }
    tr:nth-child(even) td {
      background: #fcfdff;
    }
    hr {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 24px 0;
    }
    blockquote {
      border-left: 4px solid var(--border);
      margin: 16px 0;
      padding: 0 12px;
      color: var(--muted);
    }
    .meta {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 0.9rem;
      color: var(--muted);
    }
    /* Audience toggle — Model A: single engineering appendix wrapper */
    [data-audience="engineering"] {
      display: none;
    }
    body.show-engineering [data-audience="engineering"] {
      display: block;
    }
    .audience-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 16px 0 24px;
      padding: 8px 16px;
      background: var(--header);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--muted);
      font-family: inherit;
    }
    .audience-toggle:hover {
      background: var(--border);
      color: var(--text);
    }
    @media print {
      [data-audience="engineering"] { display: none !important; }
      .audience-toggle { display: none !important; }
    }
  </style>
</head>
<body>
  <main>
    <button class="audience-toggle" id="audience-toggle" aria-pressed="false">
      Show technical details
    </button>
${params.htmlBody}
    <div class="meta">
      <div>Source: <code>${sourceRelative}</code></div>
      <div>Generated: ${generatedAtIso}</div>
    </div>
  </main>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

    // Conditionally load ELK layout engine for complex diagrams.
    const hasElk = Array.from(document.querySelectorAll(".mermaid"))
      .some(el => el.textContent?.includes("defaultRenderer"));
    if (hasElk) {
      const { default: elkLayouts } = await import(
        "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs"
      );
      mermaid.registerLayoutLoaders(elkLayouts);
    }

    // startOnLoad: false — we render manually so hidden engineering diagrams
    // (inside display:none) are not attempted on load, which causes spurious
    // "Syntax error in text" failures in Mermaid v11.
    mermaid.initialize({ startOnLoad: false, securityLevel: "antiscript", theme: "neutral" });

    // Render only the visible (operator) diagrams immediately.
    const operatorDiagrams = Array.from(document.querySelectorAll(".mermaid")).filter(
      (el) => !el.closest("[data-audience='engineering']")
    );
    if (operatorDiagrams.length > 0) {
      mermaid.run({ nodes: operatorDiagrams });
    }

    // Audience toggle — Model A.
    // Engineering diagrams are rendered on first reveal (not on load).
    let engineeringRendered = false;
    const toggleBtn = document.getElementById("audience-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const isShowing = document.body.classList.toggle("show-engineering");
        toggleBtn.textContent = isShowing ? "Hide technical details" : "Show technical details";
        toggleBtn.setAttribute("aria-pressed", String(isShowing));
        if (isShowing && !engineeringRendered) {
          // Render engineering diagrams now that they are visible.
          const nodes = Array.from(document.querySelectorAll("[data-audience='engineering'] .mermaid"));
          if (nodes.length > 0) {
            mermaid.run({ nodes });
            engineeringRendered = true;
          }
        }
      });
    }
  </script>
</body>
</html>
`;
}

async function processFile(
  inputPath: string,
  options: { outDir?: string; template: Template; palette: Palette; paletteFile?: string },
): Promise<void> {
  const absoluteInputPath = path.resolve(inputPath);
  const markdownRaw = await fs.readFile(absoluteInputPath, "utf8");
  const markdownBody = stripFrontMatter(markdownRaw);
  const title = extractTitle(markdownBody, absoluteInputPath);

  const rawHtmlBody = await renderMarkdownToHtml(markdownBody);
  const mermaidHtmlBody = transformMermaidBlocks(rawHtmlBody);
  const chartHtmlBody = transformChartBlocks(mermaidHtmlBody);
  const htmlBody = wrapEngineeringAppendix(chartHtmlBody);

  // Try to use a template file; fall back to inline HTML (basic backward compat).
  const templateContent = await loadTemplate(options.template);
  let wrappedHtml: string;

  if (templateContent) {
    wrappedHtml = applyTemplate(templateContent, {
      title,
      sourcePath: absoluteInputPath,
      htmlBody,
      palette: options.palette,
    });
    // --palette-file overrides the named palette with custom CSS content.
    if (options.paletteFile) {
      const customCss = await fs.readFile(path.resolve(options.paletteFile), "utf8");
      wrappedHtml = wrappedHtml.replace(PALETTE_CSS[options.palette], customCss);
    }
  } else {
    wrappedHtml = wrapHtmlDocument({
      title,
      sourcePath: absoluteInputPath,
      htmlBody,
    });
  }

  // Inject Chart.js loader when chart blocks are present (and not already in the template).
  if (hasChartBlocks(wrappedHtml) && !wrappedHtml.includes("chart.js@4")) {
    wrappedHtml = wrappedHtml.replace("</body>", `${CHARTJS_LOADER}\n</body>`);
  }

  const outputPath = resolveOutputPath(absoluteInputPath, options.outDir ? path.resolve(options.outDir) : undefined);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, wrappedHtml, "utf8");

  console.log(
    `[docs:render-user-html] ${path.relative(process.cwd(), absoluteInputPath)} -> ${path.relative(
      process.cwd(),
      outputPath
    )}`
  );
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  for (const inputPath of options.inputPaths) {
    await processFile(inputPath, {
      outDir: options.outDir,
      template: options.template,
      palette: options.palette,
      paletteFile: options.paletteFile,
    });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[docs:render-user-html] ERROR: ${message}`);
  printUsage();
  process.exit(1);
});
