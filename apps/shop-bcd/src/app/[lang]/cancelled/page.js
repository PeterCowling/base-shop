import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Cancelled({ searchParams }) {
    const { error } = searchParams;
    return (_jsxs("div", { className: "mx-auto max-w-lg py-20 text-center", children: [
            _jsx("h1", { className: "mb-4 text-3xl font-semibold", children: "Payment cancelled" }),
            error && _jsx("p", { className: "mb-4 text-danger", children: error }),
            _jsx("p", { children: "You have not been charged. Feel free to keep shopping." })
        ] }));
}
