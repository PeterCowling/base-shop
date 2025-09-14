import type { ReactElement } from "react";
import SubscribePage from "../src/app/[lang]/subscribe/page";
import { resolveLocale } from "@i18n/locales";
import { stripe } from "@acme/stripe";
import { readShop } from "@platform-core/repositories/shops.server";
import { getCustomerSession } from "@auth";
import { setStripeSubscriptionId } from "@platform-core/repositories/users";
import { setUserPlan } from "@platform-core/repositories/subscriptionUsage.server";
import { notFound } from "next/navigation";

jest.mock("@i18n/locales", () => ({ resolveLocale: jest.fn() }));
jest.mock("@acme/stripe", () => ({ stripe: { subscriptions: { create: jest.fn() } } }));
jest.mock("@platform-core/repositories/shops.server", () => ({ readShop: jest.fn() }));
jest.mock("@auth", () => ({ getCustomerSession: jest.fn() }));
jest.mock("@platform-core/repositories/users", () => ({ setStripeSubscriptionId: jest.fn() }));
jest.mock("@platform-core/repositories/subscriptionUsage.server", () => ({ setUserPlan: jest.fn() }));
jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

describe("SubscribePage", () => {
  it("calls notFound when disabled", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: false });
    await SubscribePage({ params: Promise.resolve({ lang: "en" }) });
    expect(notFound).toHaveBeenCalled();
  });

  it("submits plan and creates subscription", async () => {
    const stripeCreate = (stripe.subscriptions.create as jest.Mock).mockResolvedValue({ id: "sub1" });
    (readShop as jest.Mock).mockResolvedValue({
      subscriptionsEnabled: true,
      rentalSubscriptions: [{ id: "basic", itemsIncluded: 1, swapLimit: 1, shipmentsPerMonth: 1 }],
    });
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cus" });
    const ui = (await SubscribePage({ params: Promise.resolve({ lang: "en" }) })) as ReactElement;
    const form = ui.props.children[1];
    const action = form.props.action as (fd: FormData) => Promise<void>;
    const fd = new FormData();
    fd.set("plan", "basic");
    await action(fd);
    expect(stripeCreate).toHaveBeenCalled();
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("cus", "sub1", "shop");
    expect(setUserPlan).toHaveBeenCalledWith("shop", "cus", "basic");
  });
});
