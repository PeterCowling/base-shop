"use client";

import React from "react";
import Link from "next/link";

import { Tooltip } from "@acme/design-system/atoms";

export default function CommentsHelpLauncher() {
  return (
    <div className="relative">
      <div className="absolute start-2 bottom-12 flex gap-2">
        <Tooltip text="Comments">
          <button
            type="button"
            className="rounded border bg-muted/80 px-3 py-1 text-xs backdrop-blur min-h-10 min-w-10"
            onClick={() => {
              try { window.dispatchEvent(new Event("pb:toggle-comments")); } catch {}
            }}
          >
            {/* i18n-exempt: admin-only control label */}
            💬 Comments
          </button>
        </Tooltip>
        <Tooltip text="Help">
          <Link href="/cms/support" className="rounded border bg-muted/80 px-3 py-1 text-xs backdrop-blur min-h-10 min-w-10">
            {/* i18n-exempt: admin-only control label */}
            ❔ Help
          </Link>
        </Tooltip>
      </div>
    </div>
  );
}
