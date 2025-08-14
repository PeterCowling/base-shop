"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@acme/types";

export default function SubscribeClient({
  plans,
}: {
  plans: SubscriptionPlan[];
}) {
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [shipments, setShipments] = useState(0);

  const handleSelect = (plan: SubscriptionPlan) => {
    setSelected(plan);
    setShipments(1);
    try {
      localStorage.setItem("subscriptionPlan", plan.id);
      localStorage.setItem("shipmentsUsed", "1");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-3xl font-bold">Subscribe</h1>
      <ul className="space-y-4">
        {plans.map((plan) => (
          <li key={plan.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{plan.id}</h2>
                <p>
                  {plan.itemsIncluded} items · {plan.swapLimit} swaps · {plan.shipmentCount} shipments
                </p>
                <p>${(plan.price / 100).toFixed(2)}</p>
              </div>
              <button
                className="rounded bg-blue-500 px-4 py-2 text-white"
                onClick={() => handleSelect(plan)}
              >
                Select
              </button>
            </div>
          </li>
        ))}
      </ul>
      {selected && (
        <p className="mt-4">
          Selected <strong>{selected.id}</strong>. Shipments used: {shipments}/
          {selected.shipmentCount}
        </p>
      )}
    </div>
  );
}
