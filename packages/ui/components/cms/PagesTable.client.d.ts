/// <reference types="react" />
import type { Page } from "@types";
interface Props {
    shop: string;
    pages: Page[];
    canWrite?: boolean;
}
export default function PagesTable({ shop, pages, canWrite }: Props): import("react").JSX.Element;
export {};
