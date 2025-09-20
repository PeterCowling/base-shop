// apps/shop-bcd/src/app/account/orders/[id]/MobileReturnLink.test.tsx
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { toDataURL: jest.fn() },
  toDataURL: jest.fn(),
}));

import QRCode from "qrcode";
import { MobileReturnLink } from "./MobileReturnLink";

describe("MobileReturnLink", () => {
  it("renders link and shows QR when ready", async () => {
    const dataUrl = "data:image/png;base64,abc";
    // Support both default and named export mock shapes
    (QRCode as any).toDataURL?.mockResolvedValue?.(dataUrl);
    (QRCode as any).default?.toDataURL?.mockResolvedValue?.(dataUrl);

    render(<MobileReturnLink />);

    // Link is always visible
    expect(
      screen.getByRole("link", { name: /return using mobile app/i })
    ).toBeInTheDocument();

    // Image not present immediately (qr=null branch)
    expect(screen.queryByAltText(/mobile return qr/i)).toBeNull();

    // Eventually shows the QR image once promise resolves (qr truthy branch)
    await waitFor(() =>
      expect(screen.getByAltText(/mobile return qr/i)).toBeInTheDocument()
    );
  });
});

