import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";

import { Button } from "../../primitives/button";
import { Checkbox } from "../../primitives/checkbox";
import { Input } from "../../primitives/input";
import { Select } from "../../primitives/select";
import { Textarea } from "../../primitives/textarea";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./Form";

const meta = {
  title: "Molecules/Form",
  component: Form,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

// Login form example
function LoginFormExample() {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: unknown) => {
    // eslint-disable-next-line no-console -- demo purpose in Storybook
    console.log("Login data:", data);
    alert("Form submitted! Check console for data.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-[400px]">
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
                <Input {...field} type="email" placeholder="Enter your email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Enter your password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-cy="remember-me"
                />
              </FormControl>
              <FormLabel className="font-normal">Remember me</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}

// Registration form example
function RegistrationFormExample() {
  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      bio: "",
    },
  });

  const onSubmit = (data: unknown) => {
    // eslint-disable-next-line no-console -- demo purpose in Storybook
    console.log("Registration data:", data);
    alert("Form submitted! Check console for data.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-[500px]">
        <FormField
          control={form.control}
          name="username"
          rules={{
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Username</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Choose a username" />
              </FormControl>
              <FormDescription>
                This will be your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <Input {...field} type="email" placeholder="Enter your email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Create a password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          rules={{
            required: "Please confirm your password",
            validate: (value) =>
              value === form.getValues("password") || "Passwords do not match",
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Confirm Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Confirm your password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Tell us about yourself" rows={4} />
              </FormControl>
              <FormDescription>
                A short bio about yourself (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>
    </Form>
  );
}

// Validation states example
function ValidationStatesExample() {
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      requiredField: "",
      emailField: "",
      minLengthField: "",
    },
  });

  const onSubmit = (data: unknown) => {
    // eslint-disable-next-line no-console -- demo purpose in Storybook
    console.log("Form data:", data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-[500px]">
        <FormField
          control={form.control}
          name="requiredField"
          rules={{ required: "This field is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Required Field</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Type something..." />
              </FormControl>
              <FormDescription>This field cannot be empty.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailField"
          rules={{
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Please enter a valid email address",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Validation</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="name@example.com" />
              </FormControl>
              <FormDescription>
                Must be a valid email format.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minLengthField"
          rules={{
            minLength: {
              value: 5,
              message: "Must be at least 5 characters",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Length Validation</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Type at least 5 characters..." />
              </FormControl>
              <FormDescription>
                Minimum 5 characters required.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Validate Form
        </Button>
      </form>
    </Form>
  );
}

// With Zod schema example
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(18, "Must be at least 18 years old"),
  country: z.string().min(1, "Please select a country"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ZodValidationExample() {
  const form = useForm<ProfileFormData>({
    defaultValues: {
      name: "",
      age: 0,
      country: "",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    const result = profileSchema.safeParse(data);
    if (result.success) {
      // eslint-disable-next-line no-console -- demo purpose in Storybook
      console.log("Valid data:", result.data);
      alert("Form is valid! Check console for data.");
    } else {
      console.error("Validation errors:", result.error);
      // Set errors from Zod
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof ProfileFormData;
        form.setError(path, {
          type: "manual",
          message: err.message,
        });
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-[500px]">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Age</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Enter your age"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Country</FormLabel>
              <FormControl>
                <Select {...field}>
                  <option value="">Select a country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                  <option value="au">Australia</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Submit Profile
        </Button>
      </form>
    </Form>
  );
}

export const LoginForm: Story = {
  render: () => <LoginFormExample />,
};

export const RegistrationForm: Story = {
  render: () => <RegistrationFormExample />,
};

export const ValidationStates: Story = {
  render: () => <ValidationStatesExample />,
};

export const WithZodSchema: Story = {
  render: () => <ZodValidationExample />,
};
