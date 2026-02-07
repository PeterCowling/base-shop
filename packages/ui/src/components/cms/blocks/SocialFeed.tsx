"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const loadErrorLabel = t("cms.blocks.socialFeed.loadError");
  const embedLabel = t("cms.blocks.socialFeed.embedTitle");
  const missingConfigLabel = t("cms.blocks.socialFeed.missingConfig");

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleError = () => setFailed(true);
    iframe.addEventListener("error", handleError);
    return () => iframe.removeEventListener("error", handleError);
  }, []);

  if (!account && !hashtag) {
    return <p>{missingConfigLabel}</p>;
  }

  const src =
    platform === "twitter"
      ? account
        ? `https://twitframe.com/show?url=https://twitter.com/${account}`
        : `https://twitframe.com/show?url=https://twitter.com/hashtag/${hashtag}`
      : account
        ? `https://www.instagram.com/${account}/embed`
        : `https://www.instagram.com/explore/tags/${hashtag}/embed`;

  if (failed) return <p>{loadErrorLabel}</p>;

  return (
    <iframe
      ref={iframeRef}
      title={embedLabel}
      aria-label={embedLabel}
      src={src}
      className="w-full"
      data-aspect="16/9"
    />
  );
}
