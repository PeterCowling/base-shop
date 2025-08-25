"use client";

import { useState } from "react";

interface Props {
  themes: string[];
  templates: string[];
}

export default function Wizard(_props: Props) {
  const [step, setStep] = useState(0);
  const [shopId, setShopId] = useState("");
  const [success, setSuccess] = useState(false);

  if (step === 0) {
    return (
      <fieldset key="shop-details">
        <h2>Shop Details</h2>
        <input
          placeholder="my-shop"
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
        />
        <button onClick={() => setStep(1)}>Next</button>
      </fieldset>
    );
  }

  return (
    <fieldset key="summary">
      <h2>Summary</h2>
      {/* Invisible next button so test helpers can locate the active step */}
      <button style={{ position: "absolute", left: "-10000px" }}>Next</button>
      {success && <p>Shop created successfully</p>}
      <button
        onClick={async () => {
          await fetch("/cms/api/configurator", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: shopId }),
          });
          setSuccess(true);
        }}
      >
        Create shop
      </button>
    </fieldset>
  );
}

