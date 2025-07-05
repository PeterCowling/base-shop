import { jsx as _jsx } from "react/jsx-runtime";
import { CurrencyProvider } from "@platform-core/contexts/CurrencyContext";
import CurrencySwitcher from "./CurrencySwitcher.client";
const meta = {
    component: CurrencySwitcher,
    decorators: [
        (Story) => (_jsx(CurrencyProvider, { children: _jsx(Story, {}) })),
    ],
    args: {},
};
export default meta;
export const Default = {};
