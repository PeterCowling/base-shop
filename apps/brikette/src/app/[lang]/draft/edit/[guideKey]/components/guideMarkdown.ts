import MarkdownIt from "markdown-it";
import type { Node as PMNode, Schema } from "@tiptap/pm/model";
import {
  MarkdownParser,
  MarkdownSerializer,
  defaultMarkdownSerializer,
} from "@tiptap/pm/markdown";

export type GuideMarkdownCodec = {
  parse: (markdown: string) => PMNode;
  serialize: (doc: PMNode) => string;
};

const BULLET_LINE = /^\s*[*+-]\s+/u;

export function preEscapeGuideMarkdownForParse(input: string): string {
  return input.replace(/(^|\n)(\s*\d+)\.\s/g, "$1$2\\. ");
}

export function postUnescapeGuideMarkdownForStorage(input: string): string {
  return input.replace(/(^|\n)(\s*\d+)\\\.\s/g, "$1$2. ");
}

export function createGuideMarkdownCodec(
  schema: Schema,
  opts: { allowLists: boolean },
): GuideMarkdownCodec {
  const md = MarkdownIt("commonmark", { html: false });

  md.inline.ruler.disable(["link", "image", "autolink", "backticks", "html_inline"]);
  md.block.ruler.disable([
    "blockquote",
    "heading",
    "lheading",
    "fence",
    "code",
    "hr",
    "reference",
    "html_block",
  ]);
  if (!opts.allowLists) {
    md.block.ruler.disable(["list"]);
  }

  const tokens: Record<string, any> = {
    paragraph: { block: "paragraph" },
    em: { mark: "italic" },
    strong: { mark: "bold" },
  };

  // Only include list tokens if lists are allowed in the schema
  if (opts.allowLists) {
    tokens.bullet_list = { block: "bulletList" };
    tokens.list_item = { block: "listItem" };
  }

  const parser = new MarkdownParser(schema, md, tokens);

  const serializerNodes: Record<string, any> = {
    paragraph: defaultMarkdownSerializer.nodes.paragraph,
    text: defaultMarkdownSerializer.nodes.text,
  };

  // Only include list serializers if lists are allowed in the schema
  if (opts.allowLists) {
    serializerNodes.bulletList = (state: any, node: any) => state.renderList(node, "  ", () => "* ");
    serializerNodes.listItem = defaultMarkdownSerializer.nodes.list_item;
  }

  const serializer = new MarkdownSerializer(
    serializerNodes,
    {
      italic: defaultMarkdownSerializer.marks.em,
      bold: defaultMarkdownSerializer.marks.strong,
    },
    undefined,
  );

  return {
    parse: (markdown) => parser.parse(preEscapeGuideMarkdownForParse(markdown)),
    serialize: (doc) => postUnescapeGuideMarkdownForStorage(serializer.serialize(doc)),
  };
}

function isBulletLine(value: string): boolean {
  return BULLET_LINE.test(value);
}

function groupLegacyBulletLines(items: string[]): string[] {
  const result: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      result.push(buffer.join("\n"));
      buffer = [];
    }
  };

  for (const item of items) {
    if (item.includes("\n")) {
      flush();
      result.push(item);
      continue;
    }

    if (isBulletLine(item)) {
      buffer.push(item);
      continue;
    }

    flush();
    result.push(item);
  }

  flush();
  return result;
}

export function stringArrayToGuideMarkdown(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  const items = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (items.length === 0) return "";
  return groupLegacyBulletLines(items).join("\n\n");
}

export function guideMarkdownToStringArray(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
