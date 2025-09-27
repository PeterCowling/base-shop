import type { Rule } from "eslint";

/**
 * require-disable-justification
 *
 * Flags eslint-disable comments that do not include a justification suffix with a ticket ID.
 * Expected form (examples):
 *   // eslint-disable-next-line ds/no-raw-color -- ABC-123 optional text; ttl=2099-01-01
 *   /* eslint-disable ds/no-raw-typography -- ABC-123 *\/ 
 *
 * Options:
 * - ticketPattern: string (RegExp source). Default: [A-Z]{2,}-\d+
 */
const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require eslint-disable comments to include a justification with a ticket ID (e.g., -- ABC-123).",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          ticketPattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingJustification:
        "eslint-disable must include justification with a ticket ID after `--`, e.g. `-- ABC-123`.",
      missingTicket:
        "eslint-disable justification must include a ticket ID matching /{{pattern}}/.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? (context as any).getSourceCode?.();
    const options = (context.options?.[0] ?? {}) as { ticketPattern?: string };
    const ticketPattern = new RegExp(options.ticketPattern ?? "[A-Z]{2,}-\\d+");

    function checkComment(comment: any) {
      const raw = comment.value as string;
      // Normalize whitespace
      const txt = raw.trim();
      // Match eslint-disable, eslint-disable-next-line, eslint-disable-line
      if (!/^(eslint-disable(?:(?:-next)?-line)?)/.test(txt)) return;

      // Extract everything after `--` which denotes justification
      const dashIdx = txt.indexOf("--");
      if (dashIdx === -1) {
        context.report({
          loc: comment.loc,
          messageId: "missingJustification",
        });
        return;
      }
      const after = txt.slice(dashIdx + 2).trim();
      // Must contain a ticket ID somewhere after --
      if (!ticketPattern.test(after)) {
        context.report({
          loc: comment.loc,
          messageId: "missingTicket",
          data: { pattern: ticketPattern.source },
        });
        return;
      }
      // TTL metadata is optional (e.g., ttl=YYYY-MM-DD). We do not validate here.
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        for (const c of comments) checkComment(c);
      },
    } as Rule.RuleListener;
  },
};

export default rule;

