export type FilterDefinition = {
    name: string;
    label: string;
    type: "select";
    options: string[];
} | {
    name: string;
    label: string;
    type: "number";
};
export type Filters = Record<string, string | number | undefined>;
export interface FilterBarProps {
    definitions: FilterDefinition[];
    /**
     * Current values for the filters. When provided, the component becomes
     * controlled and will mirror any external updates. When omitted, an empty
     * object is assumed.
     */
    values?: Filters;
    onChange: (filters: Filters) => void;
}
export default function FilterBar({ definitions, values: externalValues, onChange, }: FilterBarProps): import("react/jsx-runtime").JSX.Element;
