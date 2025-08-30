import { NextResponse } from "next/server";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

export function GET() {
  const reactPkg = require("react/package.json");
  const reactDomPkg = require("react-dom/package.json");
  const reactPath = require.resolve("react");
  const reactDomPath = require.resolve("react-dom");
  return NextResponse.json({
    reactVersion: reactPkg.version,
    reactDomVersion: reactDomPkg.version,
    reactPath,
    reactDomPath,
    NEXT_USE_NODE_MODULES_FOR_REACT:
      process.env.NEXT_USE_NODE_MODULES_FOR_REACT ?? null,
  });
}
