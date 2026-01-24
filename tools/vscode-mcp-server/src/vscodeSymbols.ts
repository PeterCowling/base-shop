import * as vscode from "vscode";

import { getDocument, resolveUri, toLocation, toRange } from "./vscodeLanguage.js";

function normalizeSymbolKind(kind: vscode.SymbolKind): string {
  return vscode.SymbolKind[kind] ?? String(kind);
}

function toDocumentSymbol(symbol: vscode.DocumentSymbol): Record<string, unknown> {
  return {
    name: symbol.name,
    detail: symbol.detail,
    kind: normalizeSymbolKind(symbol.kind),
    range: toRange(symbol.range),
    selectionRange: toRange(symbol.selectionRange),
    children: symbol.children.map((child) => toDocumentSymbol(child)),
  };
}

function toSymbolInformation(symbol: vscode.SymbolInformation): Record<string, unknown> {
  return {
    name: symbol.name,
    kind: normalizeSymbolKind(symbol.kind),
    containerName: symbol.containerName,
    location: toLocation(symbol.location),
  };
}

function isDocumentSymbol(
  symbol: vscode.DocumentSymbol | vscode.SymbolInformation
): symbol is vscode.DocumentSymbol {
  return "selectionRange" in symbol && "children" in symbol;
}

export async function getDocumentSymbols(args: { uri: string }) {
  const uri = resolveUri(args.uri);
  await getDocument(uri);

  const result = (await vscode.commands.executeCommand(
    "vscode.executeDocumentSymbolProvider",
    uri
  )) as vscode.DocumentSymbol[] | vscode.SymbolInformation[] | undefined;

  const symbols = (result ?? []).map((symbol) =>
    isDocumentSymbol(symbol)
      ? toDocumentSymbol(symbol)
      : toSymbolInformation(symbol as vscode.SymbolInformation)
  );

  return {
    uri: uri.toString(),
    symbols,
  };
}

export async function getWorkspaceSymbols(args: {
  query: string;
  maxResults?: number;
}) {
  const query = args.query ?? "";
  if (!query.trim()) {
    throw new Error("Workspace symbol query must be a non-empty string.");
  }

  const result = (await vscode.commands.executeCommand(
    "vscode.executeWorkspaceSymbolProvider",
    query
  )) as vscode.SymbolInformation[] | undefined;

  const symbols = (result ?? []).map((symbol) =>
    toSymbolInformation(symbol as vscode.SymbolInformation)
  );

  const maxResults = args.maxResults ?? symbols.length;
  return {
    query,
    total: symbols.length,
    symbols: symbols.slice(0, Math.max(0, maxResults)),
  };
}

