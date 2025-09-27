// packages/ui/src/components/cms/blocks/SocialFeed.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Social platform to embed */
  platform: "twitter" | "instagram";
  /** Account handle without @ */
  account?: string;
  /** Hashtag without # */
  hashtag?: string;
}

/** Embed a social media feed from Twitter or Instagram */
export default function SocialFeed({ platform, account, hashtag }: Props) {
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleError = () => setFailed(true);
    iframe.addEventListener("error", handleError);
    return () => iframe.removeEventListener("error", handleError);
  }, []);

  if (!account && !hashtag) return null;

  const src =
    platform === "twitter"
      ? account
        ? `https://twitframe.com/show?url=https://twitter.com/${account}`
        : `https://twitframe.com/show?url=https://twitter.com/hashtag/${hashtag}`
      : account
        ? `https://www.instagram.com/${account}/embed`
        : `https://www.instagram.com/explore/tags/${hashtag}/embed`;

  // i18n-exempt -- Fallback load error message
  if (failed) return <p>Unable to load social feed.</p>;

  return (
    <iframe
      ref={iframeRef}
      title="social-feed"
      src={src}
      className="w-full"
      data-aspect="16/9"
    />
  );
}
