import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const resourceDefinitions = [
  {
    uri: "schema://prisma",
    name: "Prisma Schema",
    description: "Database schema defining all data models",
    mimeType: "text/plain",
  },
];

export async function handleResourceRead(uri: string) {
  if (uri === "schema://prisma") {
    try {
      // Navigate from this file to platform-core's prisma schema
      const schemaPath = join(
        dirname(fileURLToPath(import.meta.url)),
        "..",
        "..",
        "..",
        "platform-core",
        "prisma",
        "schema.prisma"
      );
      const content = await readFile(schemaPath, "utf-8");
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error reading schema: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  return {
    contents: [
      {
        uri,
        mimeType: "text/plain",
        text: `Unknown resource: ${uri}`,
      },
    ],
  };
}
