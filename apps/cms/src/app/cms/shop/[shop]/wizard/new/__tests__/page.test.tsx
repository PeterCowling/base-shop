// React 19 requires this flag to silence act warnings in tests
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseParams = jest.fn();
const mockCreateDraft = jest.fn();
const mockFinalize = jest.fn();

const mockSpec = { layout: "default", sections: [], hero: "", cta: "" };

const SpecFormMock = jest.fn(({ onNext }: any) => (
  <div data-cy="spec-form">
    <button data-cy="next" onClick={() => onNext(mockSpec)}>
      next
    </button>
  </div>
));

const PreviewPaneMock = jest.fn(({ onConfirm }: any) => (
  <div data-cy="preview-pane">
    <button data-cy="confirm" onClick={onConfirm}>
      confirm
    </button>
  </div>
));

jest.mock("next/navigation", () => ({
  useParams: mockUseParams,
}));

jest.mock("../actions", () => ({
  createDraft: mockCreateDraft,
  finalize: mockFinalize,
}));

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}));

jest.mock("../components/SpecForm", () => ({
  __esModule: true,
  default: SpecFormMock,
}));

jest.mock("../components/PreviewPane", () => ({
  __esModule: true,
  default: PreviewPaneMock,
}));

import NewWizardPage from "../page";

describe("NewWizardPage", () => {
  const shop = "test-shop";

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ shop });
    mockCreateDraft.mockResolvedValue({ id: "draft-1" });
  });

  it("renders SpecForm initially and switches to PreviewPane on next", async () => {
    render(<NewWizardPage />);
    expect(screen.getByTestId("spec-form")).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByTestId("next"));
    });

    expect(mockCreateDraft).toHaveBeenCalledWith({ shop, spec: mockSpec });
    expect(screen.getByTestId("preview-pane")).toBeInTheDocument();
  });

  it("calls finalize with shop and draftId on confirm", async () => {
    render(<NewWizardPage />);

    await act(async () => {
      await userEvent.click(screen.getByTestId("next"));
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId("confirm"));
    });

    expect(mockFinalize).toHaveBeenCalledWith({ shop, draftId: "draft-1" });
  });
});
