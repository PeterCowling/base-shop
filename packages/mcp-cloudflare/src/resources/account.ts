import { cfFetch, getAccountId } from "../client.js";

interface Account {
  id: string;
  name: string;
  type: string;
  created_on: string;
}

export const resourceDefinitions = [
  {
    uri: "cloudflare://account",
    name: "Cloudflare Account",
    description: "Current Cloudflare account information",
    mimeType: "application/json",
  },
];

export async function handleResourceRead(uri: string) {
  if (uri === "cloudflare://account") {
    try {
      const accountId = getAccountId();
      const account = await cfFetch<Account>(`/accounts/${accountId}`);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(account, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
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
