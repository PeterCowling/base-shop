import { fireEvent,render, screen } from "@testing-library/react";

import CredentialsStep from "../src/app/cms/blog/sanity/connect/CredentialsStep";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    };
  },
  { virtual: true },
);

describe("CredentialsStep", () => {
  it("calls verify on click", () => {
    const verify = jest.fn().mockResolvedValue(undefined);
    render(
      <CredentialsStep
        projectId="p"
        token="t"
        setProjectId={() => {}}
        setToken={() => {}}
        verify={verify}
        verifyStatus="idle"
        verifyError=""
        onNext={() => {}}
      />
    );
    fireEvent.click(screen.getByText(/verify/i));
    expect(verify).toHaveBeenCalled();
  });

  it("shows next button after success", () => {
    render(
      <CredentialsStep
        projectId="p"
        token="t"
        setProjectId={() => {}}
        setToken={() => {}}
        verify={jest.fn()}
        verifyStatus="success"
        verifyError=""
        onNext={() => {}}
      />
    );
    expect(screen.getByText(/next/i)).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <CredentialsStep
        projectId="p"
        token="t"
        setProjectId={() => {}}
        setToken={() => {}}
        verify={jest.fn()}
        verifyStatus="error"
        verifyError="bad creds"
        onNext={() => {}}
      />
    );
    expect(screen.getByText(/bad creds/i)).toBeInTheDocument();
  });
});
