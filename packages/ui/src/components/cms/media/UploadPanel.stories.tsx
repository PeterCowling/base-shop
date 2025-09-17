import { useEffect, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import UploadPanel from "./UploadPanel";

const meta: Meta<typeof UploadPanel> = {
  component: UploadPanel,
  args: {
    shop: "demo-shop",
    onUploaded: () => {
      /* noop for docs */
    },
    onUploadError: () => {
      /* noop for docs */
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof UploadPanel>;

export const Default: Story = {};

const PendingUploadStory = (props: ComponentProps<typeof UploadPanel>) => {
  useEffect(() => {
    const originalFetch = globalThis.fetch;
    if (!originalFetch) return;
    const pendingFetch: typeof fetch = () => new Promise<Response>(() => {});
    globalThis.fetch = pendingFetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }, []);

  return <UploadPanel {...props} />;
};

export const Uploading: Story = {
  render: (args) => <PendingUploadStory {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    if (!input) throw new Error("Upload input not found");

    const user = userEvent.setup();
    await user.upload(input, new File(["video"], "demo.mp4", { type: "video/mp4" }));
    const uploadButton = canvas.getByRole("button", { name: "Upload" });
    await user.click(uploadButton);

    await waitFor(() => {
      const uploadingButton = canvas.getByRole("button", { name: /uploading/i });
      if (!uploadingButton.hasAttribute("disabled")) {
        throw new Error("Upload button should be disabled while uploading");
      }
    });
  },
};

const ErrorUploadStory = (props: ComponentProps<typeof UploadPanel>) => {
  useEffect(() => {
    const originalFetch = globalThis.fetch;
    if (!originalFetch) return;
    const failingFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    globalThis.fetch = failingFetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }, []);

  return <UploadPanel {...props} />;
};

export const UploadError: Story = {
  render: (args) => <ErrorUploadStory {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    if (!input) throw new Error("Upload input not found");

    const user = userEvent.setup();
    await user.upload(input, new File(["video"], "demo.mp4", { type: "video/mp4" }));
    const uploadButton = canvas.getByRole("button", { name: "Upload" });
    await user.click(uploadButton);

    await waitFor(() => {
      canvas.getByText("Upload failed");
    });
  },
};
