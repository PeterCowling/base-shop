// packages/ui/src/components/cms/blocks/SocialFeed.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
/** Embed a social media feed from Twitter or Instagram */
export default function SocialFeed({ platform, account, hashtag }) {
    const [failed, setFailed] = useState(false);
    if (!account && !hashtag)
        return null;
    const src = platform === "twitter"
        ? account
            ? `https://twitframe.com/show?url=https://twitter.com/${account}`
            : `https://twitframe.com/show?url=https://twitter.com/hashtag/${hashtag}`
        : account
            ? `https://www.instagram.com/${account}/embed`
            : `https://www.instagram.com/explore/tags/${hashtag}/embed`;
    if (failed)
        return _jsx("p", { children: "Unable to load social feed." });
    return (_jsx("iframe", { title: "social-feed", src: src, className: "w-full", onError: () => setFailed(true) }));
}
