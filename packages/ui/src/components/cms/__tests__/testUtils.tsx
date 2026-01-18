import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaFileItem from "../MediaFileItem";

type Props = React.ComponentProps<typeof MediaFileItem>;

export function setupMedia(overrides: Partial<Props> & Pick<Props, "item">) {
  const onDelete = overrides.onDelete ?? jest.fn();
  const onReplace = overrides.onReplace ?? jest.fn();

  const utils = render(
    <MediaFileItem
      item={overrides.item}
      shop={(overrides as Props).shop ?? "shop"}
      onDelete={onDelete}
      onReplace={onReplace}
      onSelect={overrides.onSelect}
      onBulkToggle={overrides.onBulkToggle}
      selectionEnabled={overrides.selectionEnabled}
      selected={overrides.selected}
      deleting={overrides.deleting}
      replacing={overrides.replacing}
      disabled={overrides.disabled}
      onReplaceSuccess={overrides.onReplaceSuccess}
      onReplaceError={overrides.onReplaceError}
    />
  );

  const user = userEvent.setup();
  const fileInput = getFileInput(utils.container);

  return { ...utils, user, fileInput, onDelete, onReplace };
}

export function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

export function makeFile(name = "hello.png", type = "image/png") {
  return new File(["hello"], name, { type });
}

export function mockFetchJson<T>(data: T, status = 200) {
  global.fetch = jest.fn().mockResolvedValue(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
  return global.fetch as jest.Mock;
}

export function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const baseImageItem = {
  url: "http://example.com/image.jpg",
  type: "image" as const,
  altText: "Alt text",
  tags: ["featured", "homepage"],
  size: 12_288,
};
