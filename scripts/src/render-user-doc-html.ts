import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

type CliOptions = {
  inputPaths: string[];
  outDir?: string;
};

function printUsage(): void {
  console.log(
    [
      "Render .user.md docs to standalone .user.html companions.",
      "",
      "Usage:",
      "  pnpm docs:render-user-html -- <path/to/file.user.md> [more files...]",
      "  pnpm docs:render-user-html -- --out-dir <dir> <path/to/file.user.md> [more files...]",
      "",
      "Examples:",
      "  pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md",
      "  pnpm docs:render-user-html -- --out-dir docs/rendered docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md",
    ].join("\n")
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { inputPaths: [] };

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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
  </style>
</head>
<body>
  <main>
${params.htmlBody}
    <div class="meta">
      <div>Source: <code>${sourceRelative}</code></div>
      <div>Generated: ${generatedAtIso}</div>
    </div>
  </main>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true, securityLevel: "strict", theme: "neutral" });
  </script>
</body>
</html>
`;
}

async function processFile(inputPath: string, outDir?: string): Promise<void> {
  const absoluteInputPath = path.resolve(inputPath);
  const markdownRaw = await fs.readFile(absoluteInputPath, "utf8");
  const markdownBody = stripFrontMatter(markdownRaw);
  const title = extractTitle(markdownBody, absoluteInputPath);

  const rawHtmlBody = await renderMarkdownToHtml(markdownBody);
  const htmlBody = transformMermaidBlocks(rawHtmlBody);
  const wrappedHtml = wrapHtmlDocument({
    title,
    sourcePath: absoluteInputPath,
    htmlBody,
  });

  const outputPath = resolveOutputPath(absoluteInputPath, outDir ? path.resolve(outDir) : undefined);
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
    await processFile(inputPath, options.outDir);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[docs:render-user-html] ERROR: ${message}`);
  printUsage();
  process.exit(1);
});
