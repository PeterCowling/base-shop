import { InstagramLogoIcon, TwitterLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import type { SVGProps } from "react";

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12a10 10 0 1 0-11.5 9.95v-7.05h-2.3V12h2.3V9.8c0-2.27 1.35-3.53 3.42-3.53.99 0 2.03.17 2.03.17v2.24h-1.14c-1.12 0-1.47.7-1.47 1.42V12h2.5l-.4 2.9h-2.1v7.05A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

const icons = {
  instagram: InstagramLogoIcon,
  facebook: FacebookIcon,
  x: TwitterLogoIcon,
  linkedin: LinkedInLogoIcon,
} as const;

export interface SocialLinksProps {
  instagram?: string;
  facebook?: string;
  x?: string;
  linkedin?: string;
}

export default function SocialLinks({ instagram, facebook, x, linkedin }: SocialLinksProps) {
  const entries = [
    { key: "instagram", href: instagram },
    { key: "facebook", href: facebook },
    { key: "x", href: x },
    { key: "linkedin", href: linkedin },
  ].filter((e) => e.href);

  if (!entries.length) return null;

  return (
    <div className="flex gap-2">
      {entries.map(({ key, href }) => {
        const Icon = icons[key as keyof typeof icons];
        return (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}

