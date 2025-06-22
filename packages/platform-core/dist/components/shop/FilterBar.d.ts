export type Filters = {
    size?: string;
};
export default function FilterBar({ onChange, }: {
    onChange: (f: Filters) => void;
}): import("react").JSX.Element;
