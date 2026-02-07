import * as vscode from "vscode";

import { getTsServerDiagnostics } from "./tsserverDiagnostics.js";
import { getDocument, resolveUri, toRange } from "./vscodeLanguage.js";

type PositionInput = {
  line: number;
  character: number;
};

type RangeShape = {
  start: PositionInput;
  end: PositionInput;
};

function severityLabel(severity: vscode.DiagnosticSeverity): string {
  switch (severity) {
    case vscode.DiagnosticSeverity.Error:
      return "Error";
    case vscode.DiagnosticSeverity.Warning:
      return "Warning";
    case vscode.DiagnosticSeverity.Information:
      return "Information";
    case vscode.DiagnosticSeverity.Hint:
      return "Hint";
    default:
      return "Unknown";
  }
}

function extractCode(diagnostic: vscode.Diagnostic): string | number | undefined {
  const code = diagnostic.code;
  if (!code) {
    return undefined;
  }
  if (typeof code === "string" || typeof code === "number") {
    return code;
  }
  if (typeof code === "object" && "value" in code) {
    return code.value as string | number;
  }
  return undefined;
}

function dedupeMcpDiagnostics<
  T extends { range: RangeShape; message: string; code?: unknown; severity: string },
>(diagnostics: T[]): T[] {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    const key = JSON.stringify({
      severity: diagnostic.severity,
      code: diagnostic.code,
      message: diagnostic.message,
      range: diagnostic.range,
    });
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function getDiagnostics(args: { uri: string }) {
  const uri = resolveUri(args.uri);
  const document = await getDocument(uri);

  // VS Code's TypeScript extension generally computes diagnostics for visible editors.
  // Opening in preview + preserveFocus avoids disrupting the user's active tab while still
  // allowing tsserver to report errors for the requested file.
  const isVisible = vscode.window.visibleTextEditors.some(
    (editor) => editor.document.uri.toString() === uri.toString()
  );
  if (!isVisible) {
    try {
      await vscode.window.showTextDocument(document, {
        preview: true,
        preserveFocus: true,
      });
    } catch {
      // Ignore UI errors (e.g. if VS Code can't show the document). We'll still attempt diagnostics.
    }
  }

  // Give VS Code/tsserver a moment to publish diagnostics after opening the document.
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    const hasTsDiagnostics = diagnostics.some((diagnostic) => {
      if (
        diagnostic.severity !== vscode.DiagnosticSeverity.Error &&
        diagnostic.severity !== vscode.DiagnosticSeverity.Warning
      ) {
        return false;
      }
      const source = diagnostic.source?.toLowerCase() ?? "";
      return source.startsWith("ts") || source.startsWith("typescript");
    });
    if (hasTsDiagnostics) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  let tsserverDiagnostics: vscode.Diagnostic[] = [];
  let tsserverError: unknown;
  try {
    tsserverDiagnostics = await getTsServerDiagnostics(uri);
  } catch (error) {
    tsserverError = error;
  }

  const vscodeDiagnostics = vscode.languages.getDiagnostics(uri);

  const diagnostics = [...tsserverDiagnostics, ...vscodeDiagnostics];
  const filtered = diagnostics.filter((diagnostic) => {
    if (
      diagnostic.severity !== vscode.DiagnosticSeverity.Error &&
      diagnostic.severity !== vscode.DiagnosticSeverity.Warning
    ) {
      return false;
    }

    const source = diagnostic.source?.toLowerCase() ?? "";
    return source.startsWith("ts") || source.startsWith("typescript");
  });

  if (filtered.length === 0 && tsserverError) {
    const detail =
      tsserverError instanceof Error
        ? tsserverError.message
        : "Unknown TypeScript server error.";
    throw new Error(`TypeScript diagnostics unavailable: ${detail}`);
  }

  return {
    uri: uri.toString(),
    diagnostics: dedupeMcpDiagnostics(
      filtered.map((diagnostic) => ({
        range: toRange(diagnostic.range) as RangeShape,
        message: diagnostic.message,
        code: extractCode(diagnostic),
        source: diagnostic.source,
        severity: severityLabel(diagnostic.severity),
        relatedInformation: diagnostic.relatedInformation?.map((info) => ({
          message: info.message,
          location: {
            uri: info.location.uri.toString(),
            range: toRange(info.location.range),
          },
        })),
      }))
    ),
  };
}

