import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { useState, type FormEvent } from "react";

import PremierDeliveryEditor from "../PremierDeliveryEditor";
import type { ValidationErrors } from "../../hooks/useSettingsSaveForm";

expect.extend(toHaveNoViolations);

const updatePremierDelivery = jest.fn();

const submitMock = jest.fn();
const handleSubmitMock = jest.fn();
const toastOutcomes: Array<{ status: "success" | "error"; message: string }> = [];

const useSettingsSaveFormMock = jest.fn();

jest.mock("../../hooks/useSettingsSaveForm", () => ({
  useSettingsSaveForm: (...args: any[]) => useSettingsSaveFormMock(...args),
}));

jest.mock("@cms/actions/shops.server", () => ({
  updatePremierDelivery: (...args: any[]) => updatePremierDelivery(...args),
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
    Input: ({ name, "aria-label": ariaLabel, ...props }: any) => (
      <input aria-label={ariaLabel ?? name} name={name} {...props} />
    ),
  }),
  { virtual: true },
);

describe("PremierDeliveryEditor", () => {
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

  it("submits regions and windows and displays validation errors", async () => {
    updatePremierDelivery.mockResolvedValue({
      errors: { regions: ["Too few regions"] },
    });

    const { container } = render(
      <PremierDeliveryEditor
        shop="lux"
        initial={{ regions: ["NY"], windows: ["8-10"] }}
      />,
    );

    const serviceLabelInput = screen.getByLabelText("Service label");
    await userEvent.clear(serviceLabelInput);
    await userEvent.type(serviceLabelInput, "Express Premier");

    const surchargeInput = screen.getByLabelText("Surcharge");
    await userEvent.clear(surchargeInput);
    await userEvent.type(surchargeInput, "3.5");

    const regionInput = screen.getAllByLabelText(/Regions/i)[0];
    await userEvent.clear(regionInput);
    await userEvent.type(regionInput, "Paris");

    const windowInput = screen.getAllByLabelText(/One-hour windows/i)[0];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "10-12");

    const carrierInput = screen.getAllByLabelText(/Preferred carriers/i)[0];
    await userEvent.clear(carrierInput);
    await userEvent.type(carrierInput, "Acme Express");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updatePremierDelivery).toHaveBeenCalledTimes(1);
    const fd = updatePremierDelivery.mock.calls[0][1] as FormData;
    expect(fd.getAll("regions")).toEqual(["Paris"]);
    expect(fd.getAll("windows")).toEqual(["10-12"]);
    expect(fd.getAll("carriers")).toEqual(["Acme Express"]);
    expect(fd.get("surcharge")).toBe("3.5");
    expect(fd.get("serviceLabel")).toBe("Express Premier");

    const validationChip = await screen.findByText("Too few regions");
    expect(validationChip).toBeInTheDocument();
    expect(validationChip).toHaveAttribute("data-token", "--color-danger");
    expect(toastOutcomes).toContainEqual({
      status: "error",
      message: "Unable to update premier delivery settings.",
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("supports adding/removing entries and clears errors after success", async () => {
    updatePremierDelivery
      .mockResolvedValueOnce({ errors: { windows: ["Invalid window"] } })
      .mockResolvedValueOnce({ settings: {} });

    render(
      <PremierDeliveryEditor
        shop="lux"
        initial={{ regions: ["Rome"], windows: ["9-11"] }}
      />,
    );

    const regionsFieldset = screen.getByText("Regions").parentElement as HTMLElement;
    const windowsFieldset = screen
      .getByText(/One-hour windows/i)
      .parentElement as HTMLElement;

    await userEvent.click(screen.getByRole("button", { name: /add region/i }));
    expect(within(regionsFieldset).getAllByRole("textbox")).toHaveLength(2);

    const regionInputs = within(regionsFieldset).getAllByRole("textbox");
    await userEvent.type(regionInputs[1], "Berlin");
    await userEvent.click(within(regionsFieldset).getAllByRole("button", { name: /remove/i })[0]);
    expect(within(regionsFieldset).getAllByRole("textbox")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    const windowError = await screen.findByText("Invalid window");
    expect(windowError).toBeInTheDocument();
    expect(windowError).toHaveAttribute("data-token", "--color-danger");
    expect(toastOutcomes).toContainEqual({
      status: "error",
      message: "Unable to update premier delivery settings.",
    });

    const windowInputs = within(windowsFieldset).getAllByRole("textbox");
    await userEvent.clear(windowInputs[0]);
    await userEvent.type(windowInputs[0], "11-12");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid window")).not.toBeInTheDocument();
    });
    expect(toastOutcomes).toContainEqual({
      status: "success",
      message: "Premier delivery settings saved.",
    });
  });
});
