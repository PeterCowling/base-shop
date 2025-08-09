import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "./Table";
const meta = {
    title: "Atoms/Shadcn/Table",
    component: Table,
    tags: ["autodocs"],
    args: {},
};
export default meta;
export const Default = {
    render: (args) => (_jsxs(Table, { ...args, children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Header" }), _jsx(TableHead, { children: "Header" })] }) }), _jsx(TableBody, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Cell" }), _jsx(TableCell, { children: "Cell" })] }) })] })),
};
