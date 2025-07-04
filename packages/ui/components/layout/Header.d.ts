/// <reference types="react" />
/**
 * Reads cart cookie on the server and injects the starting quantity so the
 * first HTML paint equals the hydrated client state.
 */
export default function Header({ lang, height, padding, }: {
    lang: string;
    height?: string;
    padding?: string;
}): Promise<import("react").JSX.Element>;
