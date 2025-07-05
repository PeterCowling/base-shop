import { type Meta, type StoryObj } from "@storybook/react";
import type { CartState } from "@types";
interface WrapperProps {
    items: CartState;
}
declare function MiniCartWrapper({ items }: WrapperProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MiniCartWrapper>;
export default meta;
export declare const Empty: StoryObj<typeof MiniCartWrapper>;
export declare const Filled: StoryObj<typeof MiniCartWrapper>;
//# sourceMappingURL=MiniCart.stories.d.ts.map