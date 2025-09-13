import { render, screen, fireEvent, act } from "@testing-library/react";
import ConnectForm from "../ConnectForm.client";

jest.mock("@cms/actions/deleteSanityConfig", () => ({
  deleteSanityConfig: jest.fn().mockResolvedValue({}),
}));

jest.mock("@ui", () => ({
  Toast: ({ open, message }: any) => (open ? <div role="alert">{message}</div> : null),
}));

const hookMock = {
  formActionImpl: async () => ({ message: "", error: "", errorCode: "" }),
  formAction: undefined as undefined | ((fd: FormData) => Promise<void>),
};

jest.mock("../useSanityConnection", () => {
  const React = require("react");
  return {
    useSanityConnection: () => {
      const [state, setState] = React.useState({
        message: "",
        error: "",
        errorCode: "",
      });
      const formAction = async (formData: FormData) => {
        const res = await hookMock.formActionImpl(formData);
        setState(res);
      };
      hookMock.formAction = formAction;
      return {
        state,
        formAction,
        projectId: "p",
        setProjectId: jest.fn(),
        dataset: "blog",
        setDataset: jest.fn(),
        token: "t",
        setToken: jest.fn(),
        datasets: ["blog"],
        isAddingDataset: false,
        setIsAddingDataset: jest.fn(),
        aclMode: "public",
        setAclMode: jest.fn(),
        verifyStatus: "success",
        verifyError: "",
        verify: jest.fn(),
        handleDatasetSubmit: jest.fn(),
      } as const;
    },
  };
});

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: () => ({ pending: false }),
}));

describe("ConnectForm", () => {
  const { deleteSanityConfig } = require("@cms/actions/deleteSanityConfig");

  beforeEach(() => {
    hookMock.formActionImpl = async () => ({ message: "", error: "", errorCode: "" });
    (deleteSanityConfig as jest.Mock).mockClear();
  });

  it("transitions from credentials to dataset to confirmation", async () => {
    hookMock.formActionImpl = async () => ({ message: "Connected", error: "", errorCode: "" });
    render(<ConnectForm shopId="shop" />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByLabelText(/dataset/i)).toBeInTheDocument();
    await act(async () => {
      await hookMock.formAction!(new FormData());
    });
    expect(screen.getByText("Connected", { selector: "p" })).toBeInTheDocument();
  });

  it("maps error codes to user-friendly messages", async () => {
    hookMock.formActionImpl = async () => ({
      message: "",
      error: "raw",
      errorCode: "DATASET_LIST_ERROR",
    });
    render(<ConnectForm shopId="shop" />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await act(async () => {
      await hookMock.formAction!(new FormData());
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to list datasets");
  });

  it("invokes deleteSanityConfig on disconnect", () => {
    render(
      <ConnectForm shopId="shop" initial={{ projectId: "p", dataset: "blog" }} />,
    );
    const form = screen
      .getByRole("button", { name: /disconnect/i })
      .closest("form")!;
    fireEvent.submit(form);
    expect(deleteSanityConfig).toHaveBeenCalled();
  });
});
