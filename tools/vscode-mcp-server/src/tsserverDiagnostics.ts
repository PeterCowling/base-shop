import * as path from "node:path";

import * as vscode from "vscode";

type TsServerLocation = {
  line: number; // 1-based
  offset: number; // 1-based
};

type TsServerTextSpan = {
  start: TsServerLocation;
  end: TsServerLocation;
};

type TsServerRelatedInformation = {
  message?: string;
  span?: TsServerTextSpan & { file?: string };
};

type TsServerDiagnostic =
  | {
      // ts.server.protocol.Diagnostic
      start: TsServerLocation;
      end: TsServerLocation;
      text?: string;
      category?: string;
      code?: number;
      source?: string;
      relatedInformation?: TsServerRelatedInformation[];
    }
  | {
      // ts.server.protocol.DiagnosticWithLinePosition
      startLocation: TsServerLocation;
      endLocation: TsServerLocation;
      message?: string;
      category?: string;
      code?: number;
      source?: string;
      relatedInformation?: TsServerRelatedInformation[];
    };

async function ensureTypeScriptLanguageFeaturesActivated() {
  // We rely on the built-in TypeScript extension for `typescript.tsserverRequest`.
  const ext = vscode.extensions.getExtension("vscode.typescript-language-features");
  if (ext && !ext.isActive) {
    await ext.activate();
  }
}

function isTsServerLocation(value: unknown): value is TsServerLocation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const loc = value as TsServerLocation;
  return (
    typeof loc.line === "number" &&
    typeof loc.offset === "number" &&
    Number.isFinite(loc.line) &&
    Number.isFinite(loc.offset)
  );
}

function toVscodeRange(span: TsServerTextSpan): vscode.Range {
  const start = span.start;
  const end = span.end;

  return new vscode.Range(
    new vscode.Position(Math.max(0, start.line - 1), Math.max(0, start.offset - 1)),
    new vscode.Position(Math.max(0, end.line - 1), Math.max(0, end.offset - 1))
  );
}

function normalizeCategory(category: unknown): string {
  return typeof category === "string" ? category.toLowerCase() : "";
}

function extractDiagnostics(result: unknown): TsServerDiagnostic[] {
  if (!result) {
    return [];
  }
  if (Array.isArray(result)) {
    return result as TsServerDiagnostic[];
  }
  if (typeof result !== "object") {
    return [];
  }

  const record = result as Record<string, unknown>;
  const body = record.body;
  if (Array.isArray(body)) {
    return body as TsServerDiagnostic[];
  }

  // Be permissive: some wrappers return `{ response: { body } }` or `{ result: { body } }`.
  const maybeNested =
    (record.response as Record<string, unknown> | undefined) ??
    (record.result as Record<string, unknown> | undefined);
  if (maybeNested && Array.isArray(maybeNested.body)) {
    return maybeNested.body as TsServerDiagnostic[];
  }

  return [];
}

function toFileUri(currentFile: vscode.Uri, file: string): vscode.Uri | undefined {
  if (!file.trim()) {
    return undefined;
  }

  if (path.isAbsolute(file)) {
    return vscode.Uri.file(file);
  }

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (workspaceRoot) {
    return vscode.Uri.joinPath(workspaceRoot, file);
  }

  if (currentFile.scheme === "file") {
    return vscode.Uri.file(path.join(path.dirname(currentFile.fsPath), file));
  }

  return undefined;
}

function toVscodeDiagnostic(
  currentFile: vscode.Uri,
  diagnostic: TsServerDiagnostic
): vscode.Diagnostic | undefined {
  const category = normalizeCategory(diagnostic.category);
  const severity =
    category === "error"
      ? vscode.DiagnosticSeverity.Error
      : category === "warning"
        ? vscode.DiagnosticSeverity.Warning
        : undefined;
  if (!severity) {
    return undefined;
  }

  const rawSource = typeof diagnostic.source === "string" ? diagnostic.source : undefined;
  if (
    rawSource &&
    !rawSource.toLowerCase().startsWith("ts") &&
    !rawSource.toLowerCase().startsWith("typescript")
  ) {
    return undefined;
  }

  const message =
    "text" in diagnostic && typeof diagnostic.text === "string"
      ? diagnostic.text
      : "message" in diagnostic && typeof diagnostic.message === "string"
        ? diagnostic.message
        : "";

  const start =
    "startLocation" in diagnostic ? diagnostic.startLocation : diagnostic.start;
  const end = "endLocation" in diagnostic ? diagnostic.endLocation : diagnostic.end;

  if (!isTsServerLocation(start) || !isTsServerLocation(end)) {
    return undefined;
  }

  const range = toVscodeRange({ start, end });
  const vscodeDiagnostic = new vscode.Diagnostic(range, message, severity);
  vscodeDiagnostic.source = rawSource ?? "ts";
  if (typeof diagnostic.code === "number") {
    vscodeDiagnostic.code = diagnostic.code;
  }

  const related = diagnostic.relatedInformation
    ?.map((info) => {
      const message = typeof info.message === "string" ? info.message : undefined;
      const span = info.span;
      const file = span?.file;
      if (
        !message ||
        !span ||
        !file ||
        !isTsServerLocation(span.start) ||
        !isTsServerLocation(span.end)
      ) {
        return undefined;
      }

      const uri = toFileUri(currentFile, file);
      if (!uri) {
        return undefined;
      }

      const location = new vscode.Location(uri, toVscodeRange(span));
      return new vscode.DiagnosticRelatedInformation(location, message);
    })
    .filter(
      (info): info is vscode.DiagnosticRelatedInformation => info !== undefined
    );
  if (related && related.length > 0) {
    vscodeDiagnostic.relatedInformation = related;
  }

  return vscodeDiagnostic;
}

export async function getTsServerDiagnostics(uri: vscode.Uri): Promise<vscode.Diagnostic[]> {
  if (uri.scheme !== "file") {
    return [];
  }

  await ensureTypeScriptLanguageFeaturesActivated();

  const [syntacticResult, semanticResult] = await Promise.all([
    vscode.commands.executeCommand(
      "typescript.tsserverRequest",
      "syntacticDiagnosticsSync",
      { file: uri, includeLinePosition: true },
      true
    ),
    vscode.commands.executeCommand(
      "typescript.tsserverRequest",
      "semanticDiagnosticsSync",
      { file: uri, includeLinePosition: true },
      true
    ),
  ]);

  const diagnostics = [
    ...extractDiagnostics(syntacticResult),
    ...extractDiagnostics(semanticResult),
  ];

  return diagnostics
    .map((diagnostic) => toVscodeDiagnostic(uri, diagnostic))
    .filter((diagnostic): diagnostic is vscode.Diagnostic => diagnostic !== undefined);
}

