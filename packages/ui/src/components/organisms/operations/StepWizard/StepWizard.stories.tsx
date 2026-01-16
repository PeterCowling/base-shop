import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  StepWizard,
  StepContent,
  StepActions,
  useWizard,
  type WizardStep,
} from "./StepWizard";
import { User, CreditCard, CheckCircle, Settings } from "lucide-react";

const meta: Meta<typeof StepWizard> = {
  title: "Organisms/Operations/StepWizard",
  component: StepWizard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StepWizard>;

// Basic example steps
const basicSteps: WizardStep[] = [
  { id: "personal", title: "Personal Info", description: "Your details" },
  { id: "payment", title: "Payment", description: "Billing information" },
  { id: "confirm", title: "Confirmation", description: "Review and submit" },
];

export const Default: Story = {
  render: () => (
    <StepWizard
      steps={basicSteps}
      onComplete={() => alert("Wizard completed!")}
    >
      <StepContent stepId="personal">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="wizard-full-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full Name
              </label>
              <input
                id="wizard-full-name"
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label
                htmlFor="wizard-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="wizard-email"
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>
      </StepContent>

      <StepContent stepId="payment">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="wizard-card-number"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Card Number
              </label>
              <input
                id="wizard-card-number"
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="4242 4242 4242 4242"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="wizard-card-expiry"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Expiry
                </label>
                <input
                  id="wizard-card-expiry"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label
                  htmlFor="wizard-card-cvc"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  CVC
                </label>
                <input
                  id="wizard-card-cvc"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="123"
                />
              </div>
            </div>
          </div>
        </div>
      </StepContent>

      <StepContent stepId="confirm">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold">Confirm Your Order</h3>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>Please review your information before submitting.</p>
            <ul className="list-inside list-disc">
              <li>Personal details verified</li>
              <li>Payment method added</li>
              <li>Ready to complete</li>
            </ul>
          </div>
        </div>
      </StepContent>

      <StepActions />
    </StepWizard>
  ),
};

// With icons
const stepsWithIcons: WizardStep[] = [
  { id: "account", title: "Account", description: "Create account", icon: User },
  { id: "payment", title: "Payment", description: "Add payment", icon: CreditCard },
  { id: "settings", title: "Settings", description: "Preferences", icon: Settings },
  { id: "done", title: "Complete", description: "All done", icon: CheckCircle },
];

export const WithIcons: Story = {
  render: () => (
    <StepWizard steps={stepsWithIcons} showStepNumbers={false}>
      <StepContent stepId="account">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Create Your Account</h3>
          <p className="mt-2 text-gray-600">Set up your username and password.</p>
        </div>
      </StepContent>
      <StepContent stepId="payment">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Add Payment Method</h3>
          <p className="mt-2 text-gray-600">Enter your billing information.</p>
        </div>
      </StepContent>
      <StepContent stepId="settings">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Configure Settings</h3>
          <p className="mt-2 text-gray-600">Customize your preferences.</p>
        </div>
      </StepContent>
      <StepContent stepId="done">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">All Done!</h3>
          <p className="mt-2 text-gray-600">Your account is ready to use.</p>
        </div>
      </StepContent>
      <StepActions completeLabel="Get Started" />
    </StepWizard>
  ),
};

// Vertical orientation
export const Vertical: Story = {
  render: () => (
    <StepWizard steps={basicSteps} orientation="vertical">
      <StepContent stepId="personal">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <p className="mt-2 text-gray-600">Enter your personal details here.</p>
        </div>
      </StepContent>
      <StepContent stepId="payment">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <p className="mt-2 text-gray-600">Add your payment information.</p>
        </div>
      </StepContent>
      <StepContent stepId="confirm">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Confirmation</h3>
          <p className="mt-2 text-gray-600">Review and confirm your submission.</p>
        </div>
      </StepContent>
      <StepActions />
    </StepWizard>
  ),
};

// With validation
function ValidationExample() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const stepsWithValidation: WizardStep[] = [
    {
      id: "name",
      title: "Your Name",
      validate: () => {
        if (!name.trim()) {
          alert("Please enter your name");
          return false;
        }
        return true;
      },
    },
    {
      id: "email",
      title: "Your Email",
      validate: () => {
        if (!email.includes("@")) {
          alert("Please enter a valid email");
          return false;
        }
        return true;
      },
    },
    { id: "done", title: "Complete" },
  ];

  return (
    <StepWizard
      steps={stepsWithValidation}
      onComplete={() => alert(`Thanks ${name}! We'll email ${email}`)}
    >
      <StepContent stepId="name">
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">What&apos;s your name?</h3>
          <input
            id="wizard-validation-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter your name"
          />
        </div>
      </StepContent>
      <StepContent stepId="email">
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">What&apos;s your email?</h3>
          <input
            id="wizard-validation-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter your email"
          />
        </div>
      </StepContent>
      <StepContent stepId="done">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">All set!</h3>
          <p className="mt-2 text-gray-600">
            Name: {name}<br />
            Email: {email}
          </p>
        </div>
      </StepContent>
      <StepActions />
    </StepWizard>
  );
}

export const WithValidation: Story = {
  render: () => <ValidationExample />,
};

// With optional steps
const stepsWithOptional: WizardStep[] = [
  { id: "required1", title: "Required Step" },
  { id: "optional", title: "Optional Step", optional: true },
  { id: "required2", title: "Final Step" },
];

export const WithOptionalSteps: Story = {
  render: () => (
    <StepWizard steps={stepsWithOptional}>
      <StepContent stepId="required1">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Required Step</h3>
          <p className="mt-2 text-gray-600">This step must be completed.</p>
        </div>
      </StepContent>
      <StepContent stepId="optional">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Optional Step</h3>
          <p className="mt-2 text-gray-600">This step can be skipped.</p>
        </div>
      </StepContent>
      <StepContent stepId="required2">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Final Step</h3>
          <p className="mt-2 text-gray-600">Complete the wizard here.</p>
        </div>
      </StepContent>
      <StepActions />
    </StepWizard>
  ),
};

// Using the hook
function HookExample() {
  const wizard = useWizard();

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold">
        Step {wizard.currentStep + 1} of {wizard.steps.length}
      </h3>
      <p className="mt-2 text-gray-600">
        Current: {wizard.steps[wizard.currentStep].title}
      </p>
      <div className="mt-4 flex gap-2">
        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
          First: {wizard.isFirstStep ? "Yes" : "No"}
        </span>
        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
          Last: {wizard.isLastStep ? "Yes" : "No"}
        </span>
        <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
          Completed: {wizard.completedSteps.size}
        </span>
      </div>
    </div>
  );
}

export const UsingHook: Story = {
  render: () => (
    <StepWizard steps={basicSteps}>
      <HookExample />
      <StepActions />
    </StepWizard>
  ),
};

// Custom action buttons
export const CustomActions: Story = {
  render: () => (
    <StepWizard steps={basicSteps}>
      <StepContent stepId="personal">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Personal Info</h3>
        </div>
      </StepContent>
      <StepContent stepId="payment">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Payment</h3>
        </div>
      </StepContent>
      <StepContent stepId="confirm">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Confirm</h3>
        </div>
      </StepContent>
      <StepActions
        nextLabel="Continue"
        prevLabel="Go Back"
        completeLabel="Submit Order"
      >
        <button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Save Draft
        </button>
      </StepActions>
    </StepWizard>
  ),
};
