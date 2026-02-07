"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
jest.mock("next/image", () => ({
    __esModule: true,
    // The real `next/image` component accepts a number of props that aren't
    // valid on standard elements. To avoid DS and Next lint rules in tests,
    // render an <input type="image"> stub instead of a raw <img>.
    // Preserve `alt` for accessibility queries.
    // i18n-exempt: test-only mock component
    default: ({ unoptimized, priority, fill, alt = "", ...rest }) => react_1.default.createElement("input", { type: "image", alt: String(alt ?? ""), ...rest }),
}));
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, prefetch, children, ...rest }) => react_1.default.createElement("a", { href, ...rest }, children),
}));
// Provide a light-weight mock of next/navigation hooks for component tests.
// Reuse the shared shim to keep behavior consistent across tests.
jest.mock("next/navigation", () => ({
    __esModule: true,
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(""),
    usePathname: () => "/",
    useParams: () => ({}),
    notFound: () => {
        throw new Error("next/navigation notFound() called (stub)");
    },
    redirect: (_url) => {
        throw new Error("next/navigation redirect() called (stub)");
    },
}));
