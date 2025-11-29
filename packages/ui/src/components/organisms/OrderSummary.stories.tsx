// packages/ui/components/organisms/OrderSummary.stories.tsx

import { Meta, StoryObj } from "@storybook/nextjs";

import OrderSummary from "./OrderSummary";
import { Price } from "../atoms/Price";

/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta: Meta<typeof OrderSummary> = {
  title: "Organisms/Order Summary",
  component: OrderSummary,
  parameters: {
    providers: {
      cart: true,
      currency: true,
    },
    docs: {
      description: {
        component: "Summarizes cart totals (subtotal, shipping, tax, discounts) from CartContext. Useful within checkout and cart pages.",
      },
    },
  },
};

export default meta;

/* ------------------------------------------------------------------ *
 *  Stories
 * ------------------------------------------------------------------ */
export const Default: StoryObj<typeof OrderSummary> = {
  decorators: [
    (Story) => (
      <div className="space-y-2">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
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
            <td className="text-end">
              <Price amount={5} />
            </td>
          </tr>
          <tr>
            <td />
            <td className="py-2">Tax</td>
            <td className="text-end">
              <Price amount={3} />
            </td>
          </tr>
          <tr>
            <td />
            <td className="py-2">Discount</td>
            <td className="text-end">
              <Price amount={-2} />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  ),
};
// i18n-exempt -- Storybook demo copy
