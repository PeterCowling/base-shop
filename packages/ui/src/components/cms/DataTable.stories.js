import DataTable from "./DataTable";
const sampleRows = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
];
const sampleColumns = [
    { header: "Name", render: (r) => r.name },
    { header: "Age", render: (r) => r.age },
];
const meta = {
    component: DataTable,
    args: {
        rows: sampleRows,
        columns: sampleColumns,
        selectable: false,
    },
    argTypes: {
        rows: { control: "object" },
        columns: { control: "object" },
        selectable: { control: "boolean" },
        onSelectionChange: { action: "selectionChange" },
    },
};
export default meta;
export const Default = {};
