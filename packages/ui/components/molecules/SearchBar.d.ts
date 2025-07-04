/// <reference types="react" />
export interface SearchBarProps {
    /** Suggestions to filter based on the search query */
    suggestions: string[];
    /** Callback when a suggestion is selected */
    onSelect?(value: string): void;
    placeholder?: string;
}
export declare function SearchBar({ suggestions, onSelect, placeholder, }: SearchBarProps): import("react").JSX.Element;
