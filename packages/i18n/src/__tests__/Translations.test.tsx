import { render, renderHook } from "@testing-library/react";
import { memo, useRef, type PropsWithChildren } from "react";
import { TranslationsProvider, useTranslations } from "../Translations";

describe("TranslationsProvider and useTranslations", () => {
  it("returns translations from provided messages", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("hello")).toBe("Hallo");
  });

  it("memoises translator function when messages remain unchanged", () => {
    const messages = { hello: "Hallo" };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>
        {children}
      </TranslationsProvider>
    );

    const { result, rerender } = renderHook(
      () => {
        const t = useTranslations();
        const initial = useRef(t);
        return { t, initial };
      },
      { wrapper }
    );

    expect(result.current.t("hello")).toBe("Hallo");
    rerender();
    expect(result.current.initial.current).toBe(result.current.t);
  });

  it("updates translations and function identity when messages change", () => {
    // Use a closure variable for messages since the `renderHook` wrapper option
    // does not support receiving custom props. Updating this variable and
    // calling `rerender` will trigger the provider to receive the new
    // messages.
    let messages: Record<string, string> = { hello: "Hallo" };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>
        {children}
      </TranslationsProvider>
    );

    const { result, rerender } = renderHook(
      () => {
        const t = useTranslations();
        const initial = useRef(t);
        return { t, initial };
      },
      { wrapper }
    );

    expect(result.current.t("hello")).toBe("Hallo");

    messages = { hello: "Salut" };
    rerender();
    expect(result.current.t("hello")).toBe("Salut");
    expect(result.current.initial.current).not.toBe(result.current.t);
  });

  it("re-renders consumers when messages update", () => {
    let messages: Record<string, string> = { greet: "Hallo" };
    const Child = () => {
      const t = useTranslations();
      return <span>{t("greet")}</span>;
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>
        {children}
      </TranslationsProvider>
    );

    const { rerender, getByText } = render(<Child />, { wrapper });
    getByText("Hallo");
    messages = { greet: "Salut" };
    rerender(<Child />);
    getByText("Salut");
  });

  it("warns and falls back to the key when translation is missing", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{}}>{children}</TranslationsProvider>
    );
    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("unknown")).toBe("unknown");
    expect(warn).toHaveBeenCalledWith("Missing translation for key: unknown");
    warn.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("warns and falls back when missing translation includes variables", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{}}>{children}</TranslationsProvider>
    );
    const { result } = renderHook(() => useTranslations(), { wrapper });
    // Even with variables provided, the key should be returned and a warning logged
    expect(result.current("unknown", { name: "Sam" })).toBe("unknown");
    expect(warn).toHaveBeenCalledWith("Missing translation for key: unknown");
    warn.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("does not warn outside development mode", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{}}>{children}</TranslationsProvider>
    );
    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("unknown")).toBe("unknown");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("interpolates placeholders when variables are provided", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet", { name: "Sam" })).toBe("Hi Sam");
  });

  it("interpolates provided variables and ignores unused ones", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet", { name: "Sam", extra: "value" })).toBe(
      "Hi Sam"
    );
  });

  it("leaves placeholders intact when variables are missing", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet")).toBe("Hi {name}");
  });

  it("retains placeholders when some variables are absent", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name} from {place}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet", { name: "Sam" })).toBe(
      "Hi Sam from {place}"
    );
  });

  it("leaves placeholders intact when unrelated variables are provided", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet", { unused: "x" })).toBe("Hi {name}");
  });

  it("interpolates \"undefined\" when a variable is explicitly set to undefined", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet", { name: undefined })).toBe("Hi undefined");
  });

  it("preserves context and translator on identical re-renders", () => {
    const messages = { greet: "Hallo" };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
    );

    // Translation function identity remains stable
    const { result, rerender: rerenderHook } = renderHook(
      () => useTranslations(),
      { wrapper }
    );
    const initialT = result.current;
    rerenderHook();
    expect(result.current).toBe(initialT);

    // Consumers are not re-rendered when provider re-renders with same messages
    const Child = jest.fn(() => {
      const t = useTranslations();
      return <span>{t("greet")}</span>;
    });
    const MemoChild = memo(Child);
    const Parent = ({ count }: { count: number }) => (
      <TranslationsProvider messages={messages}>
        <MemoChild />
        <span>{count}</span>
      </TranslationsProvider>
    );

    const { rerender } = render(<Parent count={0} />);
    expect(Child).toHaveBeenCalledTimes(1);
    rerender(<Parent count={1} />);
    expect(Child).toHaveBeenCalledTimes(1);
  });
  it("renders React elements alongside string messages", () => {
    const Child = () => {
      const t = useTranslations();
      return (
        <div>
          {t("rich")}
          <span>{t("plain")}</span>
        </div>
      );
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider
        messages={{ rich: <strong>Hi</strong>, plain: "Hello" }}
      >
        {children}
      </TranslationsProvider>
    );

    const { getByText } = render(<Child />, { wrapper });
    const rich = getByText("Hi");
    expect(rich.tagName).toBe("STRONG");
    getByText("Hello");
  });
});
