import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { useState, type FormEvent } from "react";

import MaintenanceSchedulerEditor from "../MaintenanceSchedulerEditor";
import type { ValidationErrors } from "../../hooks/useSettingsSaveForm";

expect.extend(toHaveNoViolations);

const updateMaintenanceSchedule = jest.fn();

const submitMock = jest.fn();
const handleSubmitMock = jest.fn();
const toastOutcomes: Array<{ status: "success" | "error"; message: string }> = [];

const useSettingsSaveFormMock = jest.fn();

jest.mock("../../hooks/useSettingsSaveForm", () => ({
  useSettingsSaveForm: (...args: any[]) => useSettingsSaveFormMock(...args),
}));

jest.mock("@cms/actions/maintenance.server", () => ({
  updateMaintenanceSchedule: (...args: any[]) => updateMaintenanceSchedule(...args),
}));
jest.mock(
  "@/components/atoms",
  () => ({
    Toast: ({ open, message, children, ...props }: any) =>
      open ? (
        <div {...props}>
          {message}
          {children}
        </div>
      ) : null,
    Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  }),
  { virtual: true },
);
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("MaintenanceSchedulerEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toastOutcomes.length = 0;
    submitMock.mockReset();
    handleSubmitMock.mockReset();

    useSettingsSaveFormMock.mockImplementation(
      ({
        action,
        successMessage = "Settings saved.",
        errorMessage = "Unable to save settings.",
        onSuccess,
        onError,
        normalizeErrors,
      }: {
        action: (formData: FormData) => Promise<any>;
        successMessage?: string;
        errorMessage?: string;
        onSuccess?: (result: any) => void;
        onError?: (result: any) => void;
        normalizeErrors?: (result: any) => ValidationErrors | undefined;
      }) => {
        const [saving, setSaving] = useState(false);
        const [errors, setErrorsState] = useState<ValidationErrors>({});
        const [toast, setToast] = useState({
          open: false,
          status: "success" as const,
          message: "",
        });

        const setErrors = (updater: ValidationErrors | ((current: ValidationErrors) => ValidationErrors)) => {
          setErrorsState((current) =>
            typeof updater === "function"
              ? (updater as (current: ValidationErrors) => ValidationErrors)(current)
              : updater,
          );
        };

        const recordToast = (status: "success" | "error", message: string) => {
          const event = { status, message };
          toastOutcomes.push(event);
          setToast({ open: true, status, message });
        };

        const closeToast = () => setToast((current) => ({ ...current, open: false }));

        const getNormalizedErrors =
          normalizeErrors ??
          ((result: unknown) => {
            if (result && typeof result === "object" && "errors" in result) {
              return (result as { errors?: ValidationErrors }).errors;
            }
            return undefined;
          });

        const submit = async (formData: FormData) => {
          submitMock(formData);
          setSaving(true);
          try {
            const result = await action(formData);
            const normalizedErrors = getNormalizedErrors(result) ?? {};
            if (Object.keys(normalizedErrors).length > 0) {
              setErrorsState(normalizedErrors);
              recordToast("error", errorMessage);
              onError?.(result);
              return { ok: false, result };
            }

            setErrorsState({});
            onSuccess?.(result);
            recordToast("success", successMessage);
            return { ok: true, result };
          } catch (error) {
            const message = error instanceof Error ? error.message : errorMessage;
            recordToast("error", message);
            return { ok: false, error };
          } finally {
            setSaving(false);
          }
        };

        const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          handleSubmitMock(formData);
          return submit(formData);
        };

        return {
          saving,
          errors,
          setErrors,
          submit,
          handleSubmit,
          toast,
          toastClassName:
            toast.status === "error"
              ? "bg-destructive text-destructive-foreground"
              : "bg-success text-success-fg",
          closeToast,
          announceError: (message: string) => recordToast("error", message),
          announceSuccess: (message: string) => recordToast("success", message),
        };
      },
    );
  });

  it("submits the configured frequency and surfaces success feedback", async () => {
    updateMaintenanceSchedule.mockResolvedValue(undefined);

    const { container } = render(<MaintenanceSchedulerEditor />);

    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "4500");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await screen.findByText("Maintenance scan schedule updated.");
    expect(toastOutcomes).toContainEqual({
      status: "success",
      message: "Maintenance scan schedule updated.",
    });
    expect(updateMaintenanceSchedule).toHaveBeenCalledTimes(1);
    const fd = updateMaintenanceSchedule.mock.calls[0][0] as FormData;
    expect(fd.get("frequency")).toBe("4500");
    expect(Number(fd.get("frequency"))).toBe(4500);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("validates a positive frequency before submission", async () => {
    const { container } = render(<MaintenanceSchedulerEditor />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateMaintenanceSchedule).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Enter a frequency greater than zero."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Frequency must be at least 1 millisecond."),
    ).toBeInTheDocument();
    expect(toastOutcomes).toContainEqual({
      status: "error",
      message: "Frequency must be at least 1 millisecond.",
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
