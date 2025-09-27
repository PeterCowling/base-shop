 
import type { Rule } from "eslint";

// Tailwind palette names we want to forbid (non-token based)
const PALETTE = [
  "gray",
  "zinc",
  "neutral",
  "slate",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "black",
  "white",
];

const UTILITIES = [
  "text",
  "bg",
  "border",
  "ring",
  "from",
  "via",
  "to",
  "fill",
  "stroke",
];

const paletteAlternation = PALETTE.join("|");
const utilAlternation = UTILITIES.join("|");

// e.g. text-gray-700, bg-red-50, border-blue-500/50, ring-amber-400
const RAW_PALETTE_CLASS = new RegExp(
  `(?:^|\n|\s)(?:${utilAlternation})-(?:${paletteAlternation})(?:-[0-9]{1,3})?(?:\\/[0-9]{1,3})?(?=\s|$)`,
  "i"
);

// e.g. text-[#111], bg-[#111111cc]
const ARBITRARY_HEX = new RegExp(
  `(?:^|\n|\s)(?:${utilAlternation})-\\[#(?:[0-9a-fA-F]{3,8})\\](?=\s|$)`
);

// e.g. bg-[hsl(200_50%_40%_/_.5)], bg-[rgba(255,0,0,0.5)], text-[rgb(10,10,10)]
const ARBITRARY_COLOR_FUNC = new RegExp(
  `(?:^|\n|\s)(?:${utilAlternation})-\\[[^\]]*(?:rgb|rgba|hsl|hsla)\\([^\)]*\\)[^\]]*\\](?=\s|$)`,
  "i"
);

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind color utilities that reference raw palette colors or arbitrary color values; use design tokens instead.",
    },
    schema: [],
    messages: {
      noRawTw:
        "Use token-based utilities instead of raw Tailwind palette or arbitrary color: '{{value}}'",
    },
  },
  create(context) {
    function check(value: string, node: any) {
      // quick bail if no likely utilities
      if (!/(?:^|\s)(?:text|bg|border|ring|from|to|via|fill|stroke)-/.test(value))
        return;

      // Find any offending segment
      const offending =
        value.match(RAW_PALETTE_CLASS)?.[0]?.trim() ||
        value.match(ARBITRARY_HEX)?.[0]?.trim() ||
        value.match(ARBITRARY_COLOR_FUNC)?.[0]?.trim();

      if (offending) {
        context.report({ node: node as any, messageId: "noRawTw", data: { value: offending } });
      }
    }

    return {
      Literal(node: any) {
        if (typeof node.value === "string") check(node.value, node);
      },
      TemplateElement(node: any) {
        check(node.value.raw, node);
      },
    };
  },
};

export default rule;

