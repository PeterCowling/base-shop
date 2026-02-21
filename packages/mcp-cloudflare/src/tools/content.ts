import { z } from "zod";

import { cfFetchText } from "../client.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";

export const CONTENT_MARKDOWN_CONTRACT_VERSION = "content.markdown.v1";

const contentMarkdownFetchSchema = z.object({
  url: z.string().url(),
  preferSuffix: z.boolean().optional().default(false),
  maxChars: z.number().int().min(1).max(250_000).optional().default(120_000),
});

export const contentTools = [
  {
    name: "content_markdown_fetch",
    description:
      "Fetch markdown-formatted page content using Cloudflare Markdown for Agents semantics",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public URL to fetch" },
        preferSuffix: {
          type: "boolean",
          description: "Append /markdown suffix to the URL before fetching",
          default: false,
        },
        maxChars: {
          type: "number",
          description: "Maximum markdown characters returned",
          default: 120000,
        },
      },
      required: ["url"],
    },
  },
] as const;

function buildMarkdownRequestUrl(url: string, preferSuffix: boolean): string {
  const parsed = new URL(url);
  if (!preferSuffix) {
    return parsed.toString();
  }

  if (!parsed.pathname.endsWith("/markdown")) {
    parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/markdown`;
  }

  return parsed.toString();
}

function classifyUnavailableStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Access denied while requesting markdown content.";
  }
  if (status === 404) {
    return "Markdown endpoint not found for the requested URL.";
  }
  if (status === 406 || status === 415) {
    return "Markdown response was not accepted by the origin.";
  }
  return `Markdown fetch failed with status ${status}.`;
}

function isMarkdownContentType(contentType: string | null): boolean {
  return (contentType || "").toLowerCase().includes("text/markdown");
}

export async function handleContentTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "content_markdown_fetch": {
        const parsed = contentMarkdownFetchSchema.parse(args);
        const requestUrl = buildMarkdownRequestUrl(parsed.url, parsed.preferSuffix);
        const fetchedAt = new Date().toISOString();
        const response = await cfFetchText(requestUrl, {
          headers: {
            Accept: "text/markdown, text/plain;q=0.7",
            "User-Agent": "acme-mcp-cloudflare/markdown-adapter",
          },
        });

        if (!response.ok) {
          return errorResult(
            `MARKDOWN_UNAVAILABLE: ${classifyUnavailableStatus(response.status)}`
          );
        }

        if (!isMarkdownContentType(response.contentType)) {
          return errorResult(
            `MARKDOWN_CONTRACT_MISMATCH: Expected text/markdown, received ${response.contentType || "unknown"}.`
          );
        }

        if (response.body.trim().length === 0) {
          return errorResult(
            "MARKDOWN_CONTRACT_MISMATCH: Received empty markdown content."
          );
        }

        const markdown = response.body.slice(0, parsed.maxChars);
        const truncated = response.body.length > parsed.maxChars;

        return jsonResult({
          contractVersion: CONTENT_MARKDOWN_CONTRACT_VERSION,
          source: {
            url: parsed.url,
            requestUrl,
            finalUrl: response.finalUrl,
            status: response.status,
            contentType: response.contentType,
            fetchedAt,
            mode: parsed.preferSuffix ? "suffix" : "accept-header",
          },
          markdown,
          quality: {
            empty: markdown.trim().length === 0,
            truncated,
            charCount: markdown.length,
          },
        });
      }

      default:
        return errorResult(`Unknown content tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
