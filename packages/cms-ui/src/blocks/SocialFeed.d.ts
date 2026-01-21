interface Props {
    /** Social platform to embed */
    platform: "twitter" | "instagram";
    /** Account handle without @ */
    account?: string;
    /** Hashtag without # */
    hashtag?: string;
}
/** Embed a social media feed from Twitter or Instagram */
export default function SocialFeed({ platform, account, hashtag }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=SocialFeed.d.ts.map