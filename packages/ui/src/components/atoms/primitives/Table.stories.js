import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "./table";
const meta = {
    component: Table,
    args: {},
};
export default meta;
export const Default = {
    render: (args) => (_jsxs(Table, { ...args, children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Column A" }), _jsx(TableHead, { children: "Column B" })] }) }), _jsx(TableBody, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Foo" }), _jsx(TableCell, { children: "Bar" })] }) })] })),
};
