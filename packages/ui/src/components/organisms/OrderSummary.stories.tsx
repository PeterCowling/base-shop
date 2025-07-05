// packages/ui/components/organisms/OrderSummary.stories.tsx

import { Meta, StoryObj } from "@storybook/react";

import OrderSummary from "./OrderSummary";

/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta: Meta<typeof OrderSummary> = {
  title: "Organisms/Order Summary",
  component: OrderSummary,
};

export default meta;

/* ------------------------------------------------------------------ *
 *  Stories
 * ------------------------------------------------------------------ */
export const Default: StoryObj<typeof OrderSummary> = {
  render: () => (
    <div className="space-y-2">
      {/* OrderSummary reads cart data via the CartContext hook.
          In Storybook the context is mocked elsewhere (see preview.ts)
          so the component requires no props here. */}
      <OrderSummary />

      {/* Additional cost rows illustrated below the summary */}
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td />
            <td className="py-2">Shipping</td>
            <td className="text-right">€5</td>
          </tr>
          <tr>
            <td />
            <td className="py-2">Tax</td>
            <td className="text-right">€3</td>
          </tr>
          <tr>
            <td />
            <td className="py-2">Discount</td>
            <td className="text-right">-€2</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};
