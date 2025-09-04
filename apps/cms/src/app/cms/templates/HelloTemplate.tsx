import React from "react";

export interface HelloTemplateProps {
  /** Main heading text */
  title: string;
  /** Body content for the template */
  body: string;
}

/**
 * Simple template rendering a heading and body copy.
 */
export function HelloTemplate({ title, body }: HelloTemplateProps) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{body}</p>
    </section>
  );
}
