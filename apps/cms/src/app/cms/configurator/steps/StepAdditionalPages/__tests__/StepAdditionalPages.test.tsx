import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { apiRequest } from "../../../lib/api";
import StepAdditionalPages from "../StepAdditionalPages";

const markCompleteMock = jest.fn();
const pushMock = jest.fn();
const setPages = jest.fn();

jest.mock(
  require.resolve(
    "../../../../../../../../../test/__mocks__/componentStub.js",
  ),
  () => ({
    __esModule: true,
    default: ({ onSave }: any) => (
      <div>
        <span>page builder</span>
        <button onClick={() => onSave(new FormData())}>save builder</button>
      </div>
    ),
    Button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    Toast: ({ message }: any) => <div>{message}</div>,
  }),
);

jest.mock("../PageLayoutSelector", () => ({
  __esModule: true,
  default: ({ setNewPageLayout, setNewComponents }: any) => (
    <div>
      <span>layout selector</span>
      <button
        onClick={() => {
          setNewPageLayout("layout");
          setNewComponents([{ id: "comp" }] as any);
        }}
      >
        choose layout
      </button>
    </div>
  ),
}));

jest.mock("../PageMetaForm", () => ({
  __esModule: true,
  default: ({ slug, setSlug, setTitle, setDesc, setImage }: any) => (
    <div>
      <span>meta form</span>
      <span data-cy="slug-display">{slug}</span>
      <button
        onClick={() => {
          setSlug("slug");
          setTitle("title");
          setDesc("desc");
          setImage("image");
        }}
      >
        fill meta
      </button>
    </div>
  ),
}));

jest.mock("../../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markCompleteMock],
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../../../lib/api", () => ({
  apiRequest: jest.fn(),
}));
const apiRequestMock = apiRequest as jest.Mock;
apiRequestMock
  .mockResolvedValueOnce({ data: [], error: null })
  .mockResolvedValue({ data: { id: "id1" }, error: null });

describe("StepAdditionalPages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValue({ data: { id: "id1" }, error: null });
  });

  it("adds a page and saves draft", async () => {
    const user = userEvent.setup();
    render(
      <StepAdditionalPages
        pageTemplates={[{ name: "t", components: [] }]}
        pages={[]}
        setPages={setPages}
        shopId="shop"
        themeStyle={{}}
      />, 
    );

    await user.click(screen.getByTestId("add-page"));
    expect(screen.getByText("layout selector")).toBeInTheDocument();
    expect(screen.getByText("meta form")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "choose layout" }));
    await user.click(screen.getByRole("button", { name: "fill meta" }));
    await user.click(screen.getByRole("button", { name: "save builder" }));
    expect(apiRequestMock).toHaveBeenCalled();
    await screen.findByText("Draft saved");

    await user.click(screen.getByTestId("confirm-add-page"));
    expect(setPages).toHaveBeenCalledTimes(2);
    const newPages = setPages.mock.calls[1][0];
    expect(newPages).toHaveLength(1);
    expect(newPages[0].slug).toBe("slug");
  });

  it("cancel clears form and hides builder", async () => {
    const user = userEvent.setup();
    render(
      <StepAdditionalPages
        pageTemplates={[]}
        pages={[]}
        setPages={setPages}
        shopId="shop"
        themeStyle={{}}
      />, 
    );

    await user.click(screen.getByTestId("add-page"));
    await user.click(screen.getByRole("button", { name: "fill meta" }));
    expect(screen.getByTestId("slug-display")).toHaveTextContent("slug");

    await user.click(screen.getByTestId("cancel-additional-page"));
    expect(screen.queryByText("layout selector")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("add-page"));
    expect(screen.getByTestId("slug-display")).toHaveTextContent("");
  });

  it("saves and returns", async () => {
    const user = userEvent.setup();
    render(
      <StepAdditionalPages
        pageTemplates={[]}
        pages={[]}
        setPages={setPages}
        shopId="shop"
        themeStyle={{}}
      />, 
    );

    await user.click(screen.getByTestId("save-return"));
    expect(markCompleteMock).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});

