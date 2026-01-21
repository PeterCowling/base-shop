import React from "react";
import { useRouter } from "next/navigation";
import { act,fireEvent, render, screen, waitFor } from "@testing-library/react";

import useStepCompletion from "@/app/cms/configurator/hooks/useStepCompletion";
import type { DeployInfo } from "@/app/cms/wizard/services/deployShop";
import { getDeployStatus } from "@/app/cms/wizard/services/deployShop";

import StepHosting from "../src/app/cms/configurator/steps/StepHosting";

jest.useFakeTimers();

jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />,
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/app/cms/wizard/services/deployShop", () => ({
  getDeployStatus: jest.fn(),
}));

jest.mock("@/app/cms/configurator/hooks/useStepCompletion", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const markComplete = jest.fn();
(useStepCompletion as jest.Mock).mockReturnValue([false, markComplete]);
const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

function renderWithState() {
  const Wrapper = () => {
    const [deployInfo, setDeployInfo] = React.useState<DeployInfo | null>({
      status: "pending",
      domainStatus: "pending",
    });
    return (
      <StepHosting
        shopId="1"
        domain=""
        setDomain={jest.fn()}
        deployResult={null}
        deployInfo={deployInfo}
        setDeployInfo={setDeployInfo}
        deploying={false}
        deploy={jest.fn()}
      />
    );
  };
  return render(<Wrapper />);
}

describe("StepHosting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("polls getDeployStatus until non-pending", async () => {
    const mockedGetStatus = getDeployStatus as jest.Mock;
    const setDeployInfo = jest.fn();
    mockedGetStatus
      .mockResolvedValueOnce({ status: "pending", domainStatus: "pending" })
      .mockResolvedValueOnce({ status: "success", domainStatus: "success" });

    render(
      <StepHosting
        shopId="1"
        domain=""
        setDomain={jest.fn()}
        deployResult={null}
        deployInfo={{ status: "pending", domainStatus: "pending" }}
        setDeployInfo={setDeployInfo}
        deploying={false}
        deploy={jest.fn()}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedGetStatus).toHaveBeenCalledTimes(1);
    expect(setDeployInfo).toHaveBeenCalledWith({
      status: "pending",
      domainStatus: "pending",
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(mockedGetStatus).toHaveBeenCalledTimes(2);
    expect(setDeployInfo).toHaveBeenLastCalledWith({
      status: "success",
      domainStatus: "success",
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockedGetStatus).toHaveBeenCalledTimes(2);
  });

  it("calls setDomain when domain changes", () => {
    const setDomain = jest.fn();

    render(
      <StepHosting
        shopId="1"
        domain=""
        setDomain={setDomain}
        deployResult={null}
        deployInfo={null}
        setDeployInfo={jest.fn()}
        deploying={false}
        deploy={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("myshop.example.com"), {
      target: { value: "new.example.com" },
    });

    expect(setDomain).toHaveBeenCalledWith("new.example.com");
  });

  it("shows waiting message when deployment is pending", async () => {
    const mockedGetStatus = getDeployStatus as jest.Mock;
    mockedGetStatus.mockResolvedValue({ status: "pending", domainStatus: "pending" });

    renderWithState();
    await waitFor(() => expect(mockedGetStatus).toHaveBeenCalled());
    expect(screen.getByText("Waiting for domain verification…")).toBeInTheDocument();
  });

  it("shows success message when deployment completes", async () => {
    const mockedGetStatus = getDeployStatus as jest.Mock;
    mockedGetStatus.mockResolvedValue({ status: "success", domainStatus: "success" });

    renderWithState();
    await waitFor(() => expect(screen.getByText("Deployment complete")).toBeInTheDocument());
  });

  it("shows error message when deployment fails", async () => {
    const mockedGetStatus = getDeployStatus as jest.Mock;
    mockedGetStatus.mockResolvedValue({
      status: "error",
      domainStatus: "error",
      error: "oops",
    });

    renderWithState();
    await waitFor(() => expect(screen.getByText("oops")).toBeInTheDocument());
  });

  it("deploys, marks complete and redirects on save", async () => {
    let resolveDeploy: () => void;
    const deploy = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDeploy = resolve;
        })
    );

    const props = {
      shopId: "1",
      domain: "",
      setDomain: jest.fn(),
      deployResult: null,
      deployInfo: null,
      setDeployInfo: jest.fn(),
      deploy,
    };

    const { rerender } = render(
      <StepHosting {...props} deploying={false} />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save & return" }));
    });

    expect(deploy).toHaveBeenCalled();
    expect(markComplete).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    rerender(<StepHosting {...props} deploying={true} />);

    expect(screen.getByRole("button")).toHaveTextContent("Deploying…");
    expect(screen.getByRole("button")).toBeDisabled();

    resolveDeploy!();
    await waitFor(() => expect(markComplete).toHaveBeenCalledWith(true));
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});
