import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { http, HttpResponse, delay } from "msw";
import type { MediaItem } from "@acme/types";
import UploadPanel from "./UploadPanel";

const uploadedItem: MediaItem = {
  url: "/media/uploaded-video.mp4",
  altText: "Uploaded video",
  type: "video",
  tags: ["demo"],
};

const createVideoFile = () =>
  new File(["dummy content"], "demo.mp4", { type: "video/mp4" });

type StorybookMock = ReturnType<typeof fn>;

const asMock = (handler?: unknown): StorybookMock =>
  (handler as StorybookMock) ?? fn();

const uploadSuccessHandler = http.post("/cms/api/media", async () => {
  await delay(150);
  return HttpResponse.json(uploadedItem);
});

const uploadErrorHandler = http.post("/cms/api/media", async () => {
  await delay(50);
  return HttpResponse.json({ error: "Upload failed" }, { status: 500, statusText: "Upload failed" });
});

const meta: Meta<typeof UploadPanel> = {
  title: "CMS/Media/UploadPanel",
  component: UploadPanel,
  parameters: {
    layout: "padded",
    msw: {
      handlers: [uploadSuccessHandler],
    },
  },
  args: {
    shop: "demo-shop",
    onUploaded: fn<[MediaItem], void>(),
    onUploadError: fn<[string], void>(),
  },
};

export default meta;

type Story = StoryObj<typeof UploadPanel>;

export const UploadingState: Story = {
  name: "Uploading state",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const fileInput = canvasElement.querySelector<HTMLInputElement>(
      "input[type='file']"
    );
    if (!fileInput) throw new Error("File input not found");

    const onUploaded = asMock(args.onUploaded);
    onUploaded.mockClear();
    await userEvent.upload(fileInput, createVideoFile());
    const uploadButton = await canvas.findByRole("button", {
      name: /^Upload$/i,
    });

    await userEvent.click(uploadButton);
    expect(uploadButton).toBeDisabled();
    await waitFor(() => expect(uploadButton).not.toBeDisabled());
    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
  },
};

export const UploadError: Story = {
  parameters: {
    msw: {
      handlers: [uploadErrorHandler],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const fileInput = canvasElement.querySelector<HTMLInputElement>(
      "input[type='file']"
    );
    if (!fileInput) throw new Error("File input not found");

    const onUploadError = asMock(args.onUploadError);
    onUploadError.mockClear();
    await userEvent.upload(fileInput, createVideoFile());
    const uploadButton = await canvas.findByRole("button", {
      name: /^Upload$/i,
    });

    await userEvent.click(uploadButton);
    await canvas.findByText("Upload failed");
    await waitFor(() => expect(onUploadError).toHaveBeenCalledWith("Upload failed"));
  },
};
