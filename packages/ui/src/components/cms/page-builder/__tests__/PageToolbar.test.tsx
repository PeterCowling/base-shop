import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Locale } from "@acme/i18n/locales";
import PageToolbar from "../PageToolbar";
import { getLegacyPreset } from "../../../../utils/devicePresets";
import HistoryControls from "../HistoryControls";

describe("PageToolbar", () => {
  it("responds to keyboard shortcuts", () => {
    const setDeviceId = jest.fn();
    const setOrientation = jest.fn();

    render(
      <PageToolbar
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={setDeviceId}
        orientation="landscape"
        setOrientation={setOrientation}
        locale="en"
        setLocale={jest.fn()}
        locales={["en", "de"] as Locale[]}
        progress={null}
        isValid={null}
      />
    );

    fireEvent.keyDown(window, { key: "1", ctrlKey: true });
    expect(setDeviceId).toHaveBeenLastCalledWith(
      getLegacyPreset("desktop").id
    );
    expect(setOrientation).toHaveBeenLastCalledWith("portrait");

    fireEvent.keyDown(window, { key: "2", ctrlKey: true });
    expect(setDeviceId).toHaveBeenLastCalledWith(
      getLegacyPreset("tablet").id
    );
    expect(setOrientation).toHaveBeenLastCalledWith("portrait");

    fireEvent.keyDown(window, { key: "3", ctrlKey: true });
    expect(setDeviceId).toHaveBeenLastCalledWith(
      getLegacyPreset("mobile").id
    );
    expect(setOrientation).toHaveBeenLastCalledWith("portrait");
  });

  it("toggles orientation when rotate button clicked", () => {
    const Wrapper = () => {
      const [orientation, setOrientation] = React.useState<
        "portrait" | "landscape"
      >("portrait");
      return (
        <PageToolbar
          deviceId={getLegacyPreset("desktop").id}
          setDeviceId={jest.fn()}
          orientation={orientation}
          setOrientation={setOrientation}
          locale="en"
          setLocale={jest.fn()}
          locales={["en", "de"] as Locale[]}
          progress={null}
          isValid={null}
        />
      );
    };

    render(<Wrapper />);
    const rotate = screen.getByLabelText("Rotate");
    const icon = rotate.querySelector("svg")!;

    expect(icon.classList.contains("rotate-90")).toBe(false);
    fireEvent.click(rotate);
    expect(icon.classList.contains("rotate-90")).toBe(true);
    fireEvent.click(rotate);
    expect(icon.classList.contains("rotate-90")).toBe(false);
  });

  it("renders icon buttons with correct width and icon sizes", () => {
    render(
      <PageToolbar
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={jest.fn()}
        orientation="portrait"
        setOrientation={jest.fn()}
        locale="en"
        setLocale={jest.fn()}
        locales={["en", "de"] as Locale[]}
        progress={null}
        isValid={null}
      />
    );

    // Device quick buttons should be 40px tall (h-10) and 48px wide (w-12) with 16px icons (h-4 w-4)
    const desktop = screen.getByLabelText("desktop");
    expect(desktop.className).toContain("w-12");
    expect(desktop.className).toContain("h-10");
    expect(desktop.className).toContain("min-w-12");
    const desktopSvg = desktop.querySelector("svg");
    expect(desktopSvg?.classList.contains("h-4")).toBe(true);
    expect(desktopSvg?.classList.contains("w-4")).toBe(true);

    // Rotate button should also be square and its icon sized consistently
    const rotate = screen.getByLabelText("Rotate");
    expect(rotate.className).toContain("w-12");
    expect(rotate.className).toContain("h-10");
    expect(rotate.className).toContain("min-w-12");
    const rotateSvg = rotate.querySelector("svg");
    expect(rotateSvg?.classList.contains("h-4")).toBe(true);
    expect(rotateSvg?.classList.contains("w-4")).toBe(true);
  });

  it("handles locale selection and conditional indicators", () => {
    const setLocale = jest.fn();
    const { rerender } = render(
      <PageToolbar
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={jest.fn()}
        orientation="portrait"
        setOrientation={jest.fn()}
        locale="en"
        setLocale={setLocale}
        locales={["en", "de"] as Locale[]}
        progress={null}
        isValid={null}
      />
    );

    fireEvent.click(screen.getByText("DE"));
    expect(setLocale).toHaveBeenCalledWith("de");
    expect(screen.queryByText(/Uploading image/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Wrong orientation (needs landscape)")
    ).not.toBeInTheDocument();

    rerender(
      <PageToolbar
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={jest.fn()}
        orientation="portrait"
        setOrientation={jest.fn()}
        locale="en"
        setLocale={setLocale}
        locales={["en", "de"] as Locale[]}
        progress={{ done: 1, total: 2 }}
        isValid={null}
      />
    );
    expect(screen.getByText("Uploading image… 1/2")).toBeInTheDocument();

    rerender(
      <PageToolbar
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={jest.fn()}
        orientation="portrait"
        setOrientation={jest.fn()}
        locale="en"
        setLocale={setLocale}
        locales={["en", "de"] as Locale[]}
        progress={null}
        isValid={false}
      />
    );
    expect(
      screen.getByText("Wrong orientation (needs landscape)")
    ).toBeInTheDocument();
  });

  it("updates state when adding/removing sections with undo/redo", () => {
    const Wrapper = () => {
      const [sections, setSections] = React.useState<string[]>([]);
      const [history, setHistory] = React.useState<string[][]>([]);
      const [future, setFuture] = React.useState<string[][]>([]);

      const pushState = (next: string[]) => {
        setHistory((h) => [...h, sections]);
        setFuture([]);
        setSections(next);
      };

      const add = () => pushState([...sections, String(sections.length)]);
      const remove = () => pushState(sections.slice(0, -1));
      const undo = () => {
        setHistory((h) => {
          if (!h.length) return h;
          const prev = h[h.length - 1];
          setFuture((f) => [sections, ...f]);
          setSections(prev);
          return h.slice(0, -1);
        });
      };
      const redo = () => {
        setFuture((f) => {
          if (!f.length) return f;
          const next = f[0];
          setHistory((h) => [...h, sections]);
          setSections(next);
          return f.slice(1);
        });
      };

      return (
        <div>
          <button onClick={add}>Add</button>
          <button onClick={remove}>Remove</button>
          <HistoryControls
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onUndo={undo}
            onRedo={redo}
            onSave={jest.fn()}
            onPublish={jest.fn()}
            saving={false}
            publishing={false}
            autoSaveState="idle"
          />
          <div data-cy="count">{sections.length}</div>
        </div>
      );
    };

    render(<Wrapper />);
    fireEvent.click(screen.getByText("Add"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    fireEvent.click(screen.getByLabelText("Undo"));
    expect(screen.getByTestId("count").textContent).toBe("0");
    fireEvent.click(screen.getByLabelText("Redo"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
