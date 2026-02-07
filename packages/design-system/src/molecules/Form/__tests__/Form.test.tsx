import "../../../../../../../test/resetNextMocks";

import { useForm } from "react-hook-form";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../Form";

// Simple test form component
function TestForm({
  onSubmit,
  defaultValues = {},
}: {
  onSubmit: (data: Record<string, unknown>) => void;
  defaultValues?: Record<string, unknown>;
}) {
  const form = useForm({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <input {...field} data-cy="username-input" />
              </FormControl>
              <FormDescription>Enter your username</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit" data-cy="submit-button">
          Submit
        </button>
      </form>
    </Form>
  );
}

// Form with validation
function ValidatedForm({
  onSubmit,
}: {
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const form = useForm({
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  }, (errors) => {
    // Validation failed
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Email</FormLabel>
              <FormControl>
                <input {...field} data-cy="email-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit" data-cy="submit-button">
          Submit
        </button>
      </form>
    </Form>
  );
}

// Form with field-level validation (blur)
function BlurValidationForm() {
  const form = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <input {...field} data-cy="name-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

// Zod schema validation form - demonstrates integration with Zod
const zodSchema = z.object({
  age: z.number().min(18, "Must be at least 18 years old"),
});

function ZodValidationForm({
  onSubmit,
}: {
  onSubmit: (data: { age: number }) => void;
}) {
  const form = useForm<{ age: number }>({
    defaultValues: {
      age: 0,
    },
  });

  const handleFormSubmit = async (data: { age: number }) => {
    const result = zodSchema.safeParse(data);
    if (result.success) {
      onSubmit(result.data);
    } else {
      // Set errors from Zod validation
      if (result.error && result.error.issues) {
        const firstError = result.error.issues[0];
        if (firstError && firstError.path[0] === "age") {
          form.setError("age", {
            type: "validation",
            message: firstError.message,
          });
        }
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  data-cy="age-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit" data-cy="submit-button">
          Submit
        </button>
      </form>
    </Form>
  );
}

describe("Form", () => {
  // TC-01: Form renders with fields → form element with inputs in DOM
  it("renders form with fields", () => {
    render(<TestForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByText("Enter your username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  // TC-02: Validation errors display on submit → FormMessage visible with error text
  it("displays validation errors on submit", async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<ValidatedForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole("button", { name: "Submit" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  // TC-03: Successful submit fires onSubmit with form data → callback receives typed data
  it("fires onSubmit with form data when valid", async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<TestForm onSubmit={handleSubmit} defaultValues={{ username: "testuser" }} />);

    const submitButton = screen.getByRole("button", { name: "Submit" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        { username: "testuser" },
        expect.anything()
      );
    });
  });

  // TC-04: Field-level validation on blur → error appears after focus leaves invalid field
  it("validates field on blur", async () => {
    const user = userEvent.setup();

    render(<BlurValidationForm />);

    const input = screen.getByLabelText("Name");

    // Focus and blur without entering value
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });

  // TC-05: ARIA attributes correct → aria-invalid, aria-describedby link field to error
  it("sets correct ARIA attributes", async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<ValidatedForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole("button", { name: "Submit" });
    await user.click(submitButton);

    await waitFor(() => {
      // Find input by name attribute since label text includes the required asterisk
      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby");
    });
  });

  // TC-06: Works with Zod schema validation → schema validation errors propagate to FormMessage
  it("works with Zod schema validation", async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<ZodValidationForm onSubmit={handleSubmit} />);

    const ageInput = screen.getByLabelText("Age");
    await user.clear(ageInput);
    await user.type(ageInput, "16");

    const submitButton = screen.getByRole("button", { name: "Submit" });
    await user.click(submitButton);

    // The validation error is set via setError in the onSubmit handler
    await waitFor(() => {
      const errorMessage = screen.queryByText("Must be at least 18 years old");
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  // Additional test: FormLabel shows required indicator
  it("displays required indicator on FormLabel", () => {
    render(<ValidatedForm onSubmit={jest.fn()} />);

    const label = screen.getByText("Email");
    expect(label.parentElement?.textContent).toContain("*");
  });

  // Additional test: FormControl applies attributes to input
  it("applies correct attributes to input via FormControl", () => {
    render(<TestForm onSubmit={jest.fn()} />);

    const input = screen.getByLabelText("Username");

    expect(input).toHaveAttribute("id");
    expect(input).toHaveAttribute("aria-describedby");
  });

  // Additional test: Error state updates label styling
  it("updates label styling when field has error", async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<ValidatedForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole("button", { name: "Submit" });
    await user.click(submitButton);

    await waitFor(() => {
      const label = screen.getByText("Email");
      expect(label.className).toContain("text-danger");
    });
  });
});
