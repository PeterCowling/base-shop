import { CreditCardIcon,ShoppingCartIcon, TruckIcon } from "@radix-ui/react-icons";
import type { Meta, StoryObj } from "@storybook/nextjs";

import { Stepper, StepperStep } from "./Stepper";

const meta: Meta<typeof Stepper> = {
  title: "Molecules/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: {
    currentStep: 1,
    orientation: "horizontal",
  },
};
export default meta;

export const Default: StoryObj<typeof Stepper> = {
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Cart" />
      <StepperStep step={1} label="Shipping" />
      <StepperStep step={2} label="Payment" />
      <StepperStep step={3} label="Confirmation" />
    </Stepper>
  ),
};

export const WithDescriptions: StoryObj<typeof Stepper> = {
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Cart" description="Review your items" />
      <StepperStep step={1} label="Shipping" description="Enter delivery address" />
      <StepperStep step={2} label="Payment" description="Complete purchase" />
    </Stepper>
  ),
};

export const WithCustomIcons: StoryObj<typeof Stepper> = {
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Cart" icon={<ShoppingCartIcon />} />
      <StepperStep step={1} label="Shipping" icon={<TruckIcon />} />
      <StepperStep step={2} label="Payment" icon={<CreditCardIcon />} />
    </Stepper>
  ),
};

export const VerticalOrientation: StoryObj<typeof Stepper> = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Personal Information" description="Enter your name and email" />
      <StepperStep step={1} label="Account Setup" description="Choose your username and password" />
      <StepperStep step={2} label="Preferences" description="Customize your experience" />
      <StepperStep step={3} label="Review" description="Confirm your settings" />
    </Stepper>
  ),
};

export const WithDisabledSteps: StoryObj<typeof Stepper> = {
  args: {
    currentStep: 0,
  },
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Available" status="current" />
      <StepperStep step={1} label="Available" status="upcoming" />
      <StepperStep step={2} label="Disabled" status="disabled" />
      <StepperStep step={3} label="Disabled" status="disabled" />
    </Stepper>
  ),
};

export const AllCompleted: StoryObj<typeof Stepper> = {
  args: {
    currentStep: 3,
  },
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Cart" />
      <StepperStep step={1} label="Shipping" />
      <StepperStep step={2} label="Payment" />
      <StepperStep step={3} label="Confirmation" />
    </Stepper>
  ),
};

export const FirstStep: StoryObj<typeof Stepper> = {
  args: {
    currentStep: 0,
  },
  render: (args) => (
    <Stepper {...args}>
      <StepperStep step={0} label="Cart" />
      <StepperStep step={1} label="Shipping" />
      <StepperStep step={2} label="Payment" />
    </Stepper>
  ),
};

export const VerticalWithIcons: StoryObj<typeof Stepper> = {
  args: {
    currentStep: 1,
    orientation: "vertical",
  },
  render: (args) => (
    <Stepper {...args}>
      <StepperStep
        step={0}
        label="Cart"
        description="Review your items"
        icon={<ShoppingCartIcon />}
      />
      <StepperStep
        step={1}
        label="Shipping"
        description="Enter delivery address"
        icon={<TruckIcon />}
      />
      <StepperStep
        step={2}
        label="Payment"
        description="Complete purchase"
        icon={<CreditCardIcon />}
      />
    </Stepper>
  ),
};
