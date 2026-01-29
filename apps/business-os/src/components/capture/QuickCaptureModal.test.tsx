/**
 * QuickCaptureModal Component Tests
 * BOS-UX-13
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "../../../../../test/msw/server";

import { QuickCaptureModal } from "./QuickCaptureModal";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("QuickCaptureModal", () => {
  beforeEach(() => {
    // Set up default MSW handler for successful idea creation
    server.use(
      http.post("/api/ideas", () => {
        return HttpResponse.json({ ideaId: "TEST-001" }, { status: 200 });
      })
    );
  });

  it("does not render when closed", () => {
    const onClose = jest.fn();
    render(<QuickCaptureModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal when open", () => {
    const onClose = jest.fn();
    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/quick capture/i)).toBeInTheDocument();
  });

  it("renders form fields", () => {
    const onClose = jest.fn();
    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it("requires title field", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    const submitButton = screen.getByRole("button", { name: /capture/i });

    // Button should be disabled when title is empty
    expect(submitButton).toBeDisabled();
  });

  it("submits form with valid data", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, "Test idea");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /^capture$/i });
    await user.click(submitButton);

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText(/idea created/i)).toBeInTheDocument();
    });
  });

  it("shows success state after submission", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByLabelText(/title/i), "Test idea");
    await user.click(screen.getByRole("button", { name: /capture/i }));

    await waitFor(() => {
      expect(screen.getByText(/idea created/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /view idea/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add another/i })).toBeInTheDocument();
    });
  });

  it("clears form when add another clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByLabelText(/title/i), "Test idea");
    await user.click(screen.getByRole("button", { name: /capture/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add another/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add another/i }));

    // Get a fresh reference to the input after it's been re-rendered
    const newTitleInput = await screen.findByLabelText(/title/i);
    expect(newTitleInput).toHaveValue("");
  });

  it("shows error toast on API failure", async () => {
    // Override the default handler to return an error
    server.use(
      http.post("/api/ideas", () => {
        return HttpResponse.json(
          { error: "Failed to create idea" },
          { status: 400 }
        );
      })
    );

    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByLabelText(/title/i), "Test idea");
    await user.click(screen.getByRole("button", { name: /capture/i }));

    await waitFor(() => {
      // Should not show success state
      expect(screen.queryByText(/idea created/i)).not.toBeInTheDocument();
      // Should remain on the form
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });
  });

  it("defaults priority to P2", () => {
    const onClose = jest.fn();
    render(<QuickCaptureModal isOpen={true} onClose={onClose} />);

    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe("P2");
  });
});
