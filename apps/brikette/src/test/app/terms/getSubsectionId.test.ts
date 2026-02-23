import { getSubsectionId } from "@/app/[lang]/terms/getSubsectionId";

describe("getSubsectionId", () => {
  it("returns decimal subsection IDs", () => {
    expect(getSubsectionId("s6", "6.4 Changes and extensions are treated..."))
      .toBe("s6-6-4");
    expect(getSubsectionId("s7", "7.1 Check-in window 15:00-22:00..."))
      .toBe("s7-7-1");
    expect(getSubsectionId("s5", "5.1 Security Deposit rule..."))
      .toBe("s5-5-1");
  });

  it("returns appendix subsection IDs", () => {
    expect(getSubsectionId("s17", "A1. Non-Refundable Rate"))
      .toBe("s17-a1");
    expect(getSubsectionId("s17", "A2. Refundable Rate - free cancel"))
      .toBe("s17-a2");
  });

  it("returns null when there is no leading subsection pattern", () => {
    expect(getSubsectionId("s6", "No Show (continued)"))
      .toBeNull();
    expect(getSubsectionId("s2", "This section covers..."))
      .toBeNull();
  });
});
