import { describe, expect, it } from "@jest/globals";

import { buildIntentAwareBookingCopy } from "@/utils/intentAwareBookingCopy";

describe("buildIntentAwareBookingCopy", () => {
  it("returns an explicit chooser heading and private booking label", () => {
    const copy = buildIntentAwareBookingCopy({
      dormsLabel: "Dorms",
      privateBookingLabel: "Book private accommodations",
    });

    expect(copy.chooser.heading).toBe("Choose your stay");
    expect(copy.chooser.primaryLabel).toBe("Dorms");
    expect(copy.chooser.secondaryLabel).toBe("Book private accommodations");
  });

  it("keeps direct private messaging on the private branch", () => {
    const copy = buildIntentAwareBookingCopy({
      dormsLabel: "Dorms",
      privateBookingLabel: "Book private accommodations",
    });

    expect(copy.direct.private.heading).toBe("Continue with private rooms");
    expect(copy.direct.private.primaryLabel).toBe("Book private accommodations");
    expect(copy.direct.private.secondaryLabel).toBe("Dorms");
  });
});
