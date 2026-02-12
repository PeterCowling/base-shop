import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "./combobox";

const meta: Meta = {
  title: "Atoms/Primitives/Combobox",
};

export default meta;
type Story = StoryObj;

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function DefaultExample() {
  const [value, setValue] = useState("");

  return (
    <div className="w-80">
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger>
          {value
            ? frameworks.find((fw) => fw.value === value)?.label
            : "Select framework..."}
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search frameworks..." />
          {frameworks.map((framework) => (
            <ComboboxItem key={framework.value} value={framework.value}>
              {framework.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultExample />,
};

function WithKeywordsExample() {
  const [value, setValue] = useState("");

  const fruits = [
    { value: "apple", label: "Apple", keywords: ["red", "fruit", "sweet"] },
    {
      value: "banana",
      label: "Banana",
      keywords: ["yellow", "fruit", "tropical"],
    },
    {
      value: "carrot",
      label: "Carrot",
      keywords: ["orange", "vegetable", "root"],
    },
    {
      value: "broccoli",
      label: "Broccoli",
      keywords: ["green", "vegetable", "healthy"],
    },
  ];

  return (
    <div className="w-80">
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger>
          {value
            ? fruits.find((f) => f.value === value)?.label
            : "Select food..."}
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search by name or keyword..." />
          {fruits.map((food) => (
            <ComboboxItem
              key={food.value}
              value={food.value}
              keywords={food.keywords}
            >
              {food.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No food found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      <p className="mt-4 text-sm text-muted-foreground">
        Try searching: red, vegetable, tropical, green
      </p>
    </div>
  );
}

export const WithKeywords: Story = {
  render: () => <WithKeywordsExample />,
};

export const Uncontrolled: Story = {
  render: () => {
    return (
      <div className="w-80">
        <Combobox defaultValue="react">
          <ComboboxTrigger>Select framework...</ComboboxTrigger>
          <ComboboxContent>
            <ComboboxInput placeholder="Search frameworks..." />
            {frameworks.map((framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            ))}
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
    );
  },
};

function CustomEmptyExample() {
  const [value, setValue] = useState("");

  return (
    <div className="w-80">
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger>Select framework...</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search frameworks..." />
          {frameworks.map((framework) => (
            <ComboboxItem key={framework.value} value={framework.value}>
              {framework.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>
            <div className="flex flex-col items-center gap-2">
              <span>No results found</span>
              <span className="text-xs">Try a different search term</span>
            </div>
          </ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export const CustomEmpty: Story = {
  render: () => <CustomEmptyExample />,
};
