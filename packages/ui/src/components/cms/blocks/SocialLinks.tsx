import React from "react";

interface Props {
  instagram?: string;
  facebook?: string;
  x?: string;
  linkedin?: string;
  className?: string;
  [key: string]: unknown;
}

const icons = {
  instagram: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M7 2C4.238 2 2 4.238 2 7v10c0 2.762 2.238 5 5 5h10c2.762 0 5-2.238 5-5V7c0-2.762-2.238-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-3a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
    </svg>
  ),
  facebook: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-2.9h2v-2.2c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2v1.8h2.5l-.4 2.9h-2.1v7A10 10 0 0022 12z"/>
    </svg>
  ),
  x: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M17.37 2H21l-7.62 8.71L22.48 22H16.1l-5.1-6.76L4.8 22H1.17l8.11-9.28L1.86 2h6.49l4.6 6.09L17.37 2z"/>
    </svg>
  ),
  linkedin: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20.447 20.452H17.2v-5.569c0-1.328-.026-3.037-1.85-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.018V9h3.112v1.561h.045c.434-.82 1.494-1.686 3.073-1.686 3.287 0 3.892 2.164 3.892 4.977v6.6zM5.337 7.433a1.803 1.803 0 110-3.606 1.803 1.803 0 010 3.606zM6.837 20.452H3.837V9h2.999v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
    </svg>
  ),
} as const;

type IconKey = keyof typeof icons;

export default function SocialLinks({
  instagram,
  facebook,
  x,
  linkedin,
  className,
}: Props) {
  const entries: { key: IconKey; href?: string }[] = [
    { key: "instagram", href: instagram },
    { key: "facebook", href: facebook },
    { key: "x", href: x },
    { key: "linkedin", href: linkedin },
  ];

  const links = entries.filter((e) => e.href);
  if (!links.length) return null;

  return (
    <div className={"flex gap-2 " + (className ?? "")}> 
      {links.map(({ key, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={key}
        >
          {icons[key]}
        </a>
      ))}
    </div>
  );
}
