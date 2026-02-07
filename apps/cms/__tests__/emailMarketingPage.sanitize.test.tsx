import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import EmailMarketingPage from "../src/app/cms/marketing/email/page";

jest.mock(
  "@acme/email-templates",
  () => ({
    marketingEmailTemplates: [
      {
        id: "basic",
        label: "Basic",
        buildSubject: (h: string) => h,
        make: ({ headline, content }: any) => (
          <div>
            <h1>{headline}</h1>
            {content}
          </div>
        ),
      },
    ],
  }),
  { virtual: true }
);

describe("EmailMarketingPage sanitization", () => {
  it("cleans preview body HTML", async () => {
    render(<EmailMarketingPage />);

    const textarea = await screen.findByLabelText(/HTML body/i);
    fireEvent.change(textarea, {
      target: {
        value: '<img alt="malicious" src="x" onerror="alert(1)" />',
      },
    });

    const img = await screen.findByAltText("malicious");
    expect(img).toBeInTheDocument();
    expect(img).not.toHaveAttribute("onerror");
  });
});

