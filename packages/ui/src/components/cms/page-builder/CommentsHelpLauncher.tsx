"use client";

import React from "react";
import { Tooltip } from "../../atoms";
import Link from "next/link";

export default function CommentsHelpLauncher() {
  return (
    <div className="absolute start-2 bottom-12 z-40 flex gap-2">
      <Tooltip text="Comments">
        <button
          type="button"
          className="rounded border bg-muted/80 px-2 py-1 text-xs backdrop-blur"
          onClick={() => {
            try { window.dispatchEvent(new Event("pb:toggle-comments")); } catch {}
          }}
        >
          💬 Comments
        </button>
      </Tooltip>
      <Tooltip text="Help">
        <Link href="/cms/support" className="rounded border bg-muted/80 px-2 py-1 text-xs backdrop-blur">
          ❔ Help
        </Link>
      </Tooltip>
    </div>
  );
}
