import { NextResponse } from "next/server";

import { readRbac } from "@/lib/server/rbacStore";

export async function GET() {
  try {
    const db = await readRbac();
    const set = new Set<string>();
    for (const user of Object.values(db.users)) {
      if (user.email) set.add(user.email);
      if (user.name) set.add(user.name);
    }
    const people = Array.from(set).filter(Boolean);
    return NextResponse.json(people);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

