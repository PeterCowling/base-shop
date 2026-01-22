
import "@testing-library/jest-dom";

import { parseLoanItem, parseLoanMethod, parseTxType } from "../loanParsers";

describe("loanParsers", () => {
  describe("parseLoanItem", () => {
    it("parses recognized items", () => {
      expect(parseLoanItem("Hairdryer")).toBe("Hairdryer");
      expect(parseLoanItem("steamer")).toBe("Steamer");
      expect(parseLoanItem("padlock")).toBe("Padlock");
      expect(parseLoanItem("keycard")).toBe("Keycard");
    });

    it("falls back to No_card", () => {
      expect(parseLoanItem("unknown")).toBe("No_card");
      expect(parseLoanItem()).toBe("No_card");
    });
  });

  describe("parseTxType", () => {
    it("parses recognized tx types", () => {
      expect(parseTxType("Loan")).toBe("Loan");
      expect(parseTxType("refund")).toBe("Refund");
      expect(parseTxType("no_card")).toBe("No_Card");
    });

    it("defaults to Loan", () => {
      expect(parseTxType("blah")).toBe("Loan");
      expect(parseTxType()).toBe("Loan");
    });
  });

  describe("parseLoanMethod", () => {
    it("parses recognized methods", () => {
      expect(parseLoanMethod("cash")).toBe("CASH");
      expect(parseLoanMethod("PASSPORT")).toBe("PASSPORT");
      expect(parseLoanMethod("license")).toBe("LICENSE");
      expect(parseLoanMethod("id")).toBe("ID");
    });

    it("defaults to NO_CARD", () => {
      expect(parseLoanMethod("x")).toBe("NO_CARD");
      expect(parseLoanMethod()).toBe("NO_CARD");
    });
  });
});
