import * as path from "node:path";

import * as vscode from "vscode";

type PositionInput = {
  line: number;
  character: number;
};

type RangeShape = {
  start: PositionInput;
  end: PositionInput;
};

const URI_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function getWorkspaceRoot(): vscode.Uri {
  const [folder] = vscode.workspace.workspaceFolders ?? [];
  if (!folder) {
    throw new Error("No workspace folder is open; cannot resolve relative paths.");
  }
  return folder.uri;
}

export function resolveUri(input: string): vscode.Uri {
  if (URI_SCHEME.test(input)) {
    return vscode.Uri.parse(input, true);
  }

  if (path.isAbsolute(input)) {
    return vscode.Uri.file(input);
  }

  const workspaceRoot = getWorkspaceRoot();
  return vscode.Uri.joinPath(workspaceRoot, input);
}

export async function getDocument(uri: vscode.Uri): Promise<vscode.TextDocument> {
  const existing = vscode.workspace.textDocuments.find(
    (doc) => doc.uri.toString() === uri.toString()
  );
  if (existing) {
    return existing;
  }
  return vscode.workspace.openTextDocument(uri);
}

function toPosition(position: vscode.Position): PositionInput {
  return {
    line: position.line,
    character: position.character,
  };
}

export function toRange(range: vscode.Range): RangeShape {
  return {
    start: toPosition(range.start),
    end: toPosition(range.end),
  };
}

export function toLocation(
  location: vscode.Location | vscode.LocationLink
): Record<string, unknown> {
  if ("targetUri" in location) {
    return {
      uri: location.targetUri.toString(),
      targetRange: toRange(location.targetRange),
      targetSelectionRange: location.targetSelectionRange
        ? toRange(location.targetSelectionRange)
        : undefined,
      originSelectionRange: location.originSelectionRange
        ? toRange(location.originSelectionRange)
        : undefined,
    };
  }

  return {
    uri: location.uri.toString(),
    range: toRange(location.range),
  };
}

function coercePosition(input: PositionInput): vscode.Position {
  if (
    typeof input?.line !== "number" ||
    typeof input?.character !== "number" ||
    Number.isNaN(input.line) ||
    Number.isNaN(input.character)
  ) {
    throw new Error("Position must include numeric line and character.");
  }

  return new vscode.Position(input.line, input.character);
}

function stringifyMarkedString(
  value: vscode.MarkedString | vscode.MarkdownString
): string {
  if (typeof value === "string") {
    return value;
  }

  if ("value" in value && typeof value.value === "string") {
    return value.value;
  }

  if ("language" in value && typeof value.value === "string") {
    return `${value.language}: ${value.value}`;
  }

  return String(value);
}

function extractHoverText(hover: vscode.Hover): string[] {
  const contents = Array.isArray(hover.contents)
    ? hover.contents
    : [hover.contents];

  return contents.map((content) => stringifyMarkedString(content));
}

export async function getHover(args: { uri: string; position: PositionInput }) {
  const uri = resolveUri(args.uri);
  await getDocument(uri);

  const position = coercePosition(args.position);
  const hovers = (await vscode.commands.executeCommand(
    "vscode.executeHoverProvider",
    uri,
    position
  )) as vscode.Hover[] | undefined;

  const results = (hovers ?? []).flatMap((hover) =>
    extractHoverText(hover).map((text) => ({
      text,
      range: hover.range ? toRange(hover.range) : undefined,
    }))
  );

  return {
    uri: uri.toString(),
    position: args.position,
    contents: results,
  };
}

export async function getDefinition(args: {
  uri: string;
  position: PositionInput;
}) {
  const uri = resolveUri(args.uri);
  await getDocument(uri);

  const position = coercePosition(args.position);
  const result = (await vscode.commands.executeCommand(
    "vscode.executeDefinitionProvider",
    uri,
    position
  )) as vscode.Location | vscode.LocationLink[] | vscode.Location[] | undefined;

  const locations = Array.isArray(result)
    ? result
    : result
      ? [result]
      : [];

  return {
    uri: uri.toString(),
    position: args.position,
    definitions: locations.map((location) => toLocation(location)),
  };
}

export async function getTypeDefinition(args: {
  uri: string;
  position: PositionInput;
}) {
  const uri = resolveUri(args.uri);
  await getDocument(uri);

  const position = coercePosition(args.position);
  const result = (await vscode.commands.executeCommand(
    "vscode.executeTypeDefinitionProvider",
    uri,
    position
  )) as vscode.Location | vscode.LocationLink[] | vscode.Location[] | undefined;

  const locations = Array.isArray(result)
    ? result
    : result
      ? [result]
      : [];

  return {
    uri: uri.toString(),
    position: args.position,
    typeDefinitions: locations.map((location) => toLocation(location)),
  };
}

export async function getReferences(args: {
  uri: string;
  position: PositionInput;
  includeDeclaration?: boolean;
}) {
  const uri = resolveUri(args.uri);
  await getDocument(uri);

  const position = coercePosition(args.position);
  const includeDeclaration = args.includeDeclaration ?? false;
  const result = (await vscode.commands.executeCommand(
    "vscode.executeReferenceProvider",
    uri,
    position,
    includeDeclaration
  )) as vscode.Location[] | undefined;

  return {
    uri: uri.toString(),
    position: args.position,
    includeDeclaration,
    references: (result ?? []).map((location) => toLocation(location)),
  };
}
