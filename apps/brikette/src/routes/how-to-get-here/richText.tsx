import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { externalLinkClass } from "./styles";
import type { DestinationLink, RichText } from "./types";
import { resolveRichTextParts } from "./normalizers";

function resolveHref(link: DestinationLink, basePath: string) {
  if (link.internal && !link.href.startsWith("/")) {
    return `${basePath}/${link.href}`;
  }
  return link.href;
}

export function renderRichText(note: RichText | undefined, basePath: string): ReactNode {
  const parts = resolveRichTextParts(note);
  if (!parts.length) {
    return null;
  }

  return parts.map((part, index) => {
    if (part.type === "text") {
      return <Fragment key={`text-${index}`}>{part.value}</Fragment>;
    }

    const resolvedHref = resolveHref(part, basePath);
    const key = `${resolvedHref}-${index}`;

    if (part.internal) {
      return (
        <Link key={key} className={externalLinkClass} prefetch="intent" to={resolvedHref}>
          {part.label}
        </Link>
      );
    }

    return (
      <a
        key={key}
        className={externalLinkClass}
        href={resolvedHref}
        rel={part.external === false ? undefined : "noreferrer"}
        target={part.external === false ? undefined : "_blank"}
      >
        {part.label}
      </a>
    );
  });
}

export { resolveHref };
