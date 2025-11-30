// apps/cover-me-pretty/src/app/account/orders/[id]/MobileReturnLink.test.tsx
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
    type QRCodeMock = {
      toDataURL: jest.Mock;
      default: {
        toDataURL: jest.Mock;
      };
    };
    const qrCodeMock = QRCode as unknown as QRCodeMock;
    // Support both default and named export mock shapes
    qrCodeMock.toDataURL.mockResolvedValue(dataUrl);
    qrCodeMock.default.toDataURL.mockResolvedValue(dataUrl);

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
