export interface SearchBarProps {
    /** Suggestions to filter based on the search query */
    suggestions: string[];
    /** Callback when a suggestion is selected */
    onSelect?(value: string): void;
    /** Callback when a search is manually submitted */
    onSearch?(value: string): void;
    placeholder?: string;
    /** Accessible label for the search input */
    label: string;
    /** Optional search query to display */
    query?: string;
}
export declare function SearchBar({ suggestions, onSelect, onSearch, placeholder, label, query: initialQuery, }: SearchBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SearchBar.d.ts.map