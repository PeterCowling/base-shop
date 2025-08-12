"use client";

import { useEffect, useState } from "react";

export interface SocialFeedProps {
  provider: "instagram" | "twitter";
  account?: string;
  hashtag?: string;
}

export default function SocialFeed({
  provider,
  account,
  hashtag,
}: SocialFeedProps) {
  const [error, setError] = useState(false);

  const href = provider === "twitter"
    ? account
      ? `https://twitter.com/${account}`
      : hashtag
      ? `https://twitter.com/hashtag/${encodeURIComponent(hashtag)}`
      : undefined
    : account
    ? `https://www.instagram.com/${account}`
    : hashtag
    ? `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}`
    : undefined;

  useEffect(() => {
    if (!href) return;
    const script = document.createElement("script");
    script.async = true;
    script.src =
      provider === "twitter"
        ? "https://platform.twitter.com/widgets.js"
        : "https://www.instagram.com/embed.js";
    script.onerror = () => setError(true);
    script.onload = () => {
      if (provider === "twitter") {
        (window as any).twttr?.widgets.load();
      } else {
        (window as any).instgrm?.Embeds.process();
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [provider, href]);

  if (!href) return null;
  if (error) {
    return <p>Unable to load social feed.</p>;
  }

  if (provider === "twitter") {
    return (
      <blockquote className="twitter-timeline">
        <a href={href}>Tweets by {account || `#${hashtag}`}</a>
      </blockquote>
    );
  }

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={href}
      data-instgrm-version="14"
    >
      <a href={href}>Instagram</a>
    </blockquote>
  );
}

