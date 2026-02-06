import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { USERS } from "@/lib/current-user";

export const runtime = "edge";

/** Person type returned by the people endpoint. Extends User with capacity info. */
interface Person {
  id: string;
  name: string;
  role: "admin" | "user";
  capacity: {
    maxActiveWip: number;
  };
  skills?: string[];
  focusAreas?: string[];
}

const DEFAULT_MAX_ACTIVE_WIP = 3;

/**
 * GET /api/agent/people
 * List people profiles for agents. Reads from in-memory user catalog.
 * Phase 0: Returns hardcoded users with default capacity.
 * Future: Merge with rich profile data from docs/business-os/people/.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const people: Person[] = Object.values(USERS).map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    capacity: {
      maxActiveWip: DEFAULT_MAX_ACTIVE_WIP,
    },
  }));

  return NextResponse.json({ people });
}
